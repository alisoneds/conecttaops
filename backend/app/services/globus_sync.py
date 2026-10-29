import logging
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.db.globus import get_globus_connection
from app.db.session import AsyncSessionLocal
from app.models.frota import Veiculo
from app.models.ordem_servico import OrdemServico
from app.models.auditoria import AuditLogSync
from app.services.data_auditor import DataAuditor
from app.core.config import settings

logger = logging.getLogger("conecttaops.sync")

def mapear_tipo_os(tipo_raw: str) -> str:
    tipo = str(tipo_raw or "").strip().upper()
    if tipo in ["P", "PREV", "PREVENTIVA"]:
        return "Preventiva"
    elif tipo in ["PR", "PRED", "PREDITIVA"]:
        return "Preditiva"
    return "Corretiva"

def mapear_status_os(status_raw: str) -> str:
    status = str(status_raw or "").strip().upper()
    if status in ["F", "FECHADA", "CONCLUIDA"]:
        return "Concluida"
    elif status in ["E", "EM ANDAMENTO", "EXECUCAO"]:
        return "Em Andamento"
    elif status in ["C", "CANCELADA"]:
        return "Cancelada"
    return "Aberta"

async def sync_frota_globus():
    logger.info("Iniciando extração de Frota e OSs a partir de 01/01/2024...")
    
    # 1. Query da Frota Ativa (Empresa 2 / Garagem 2 - JTU)
    oracle_query_veiculos = """
        SELECT 
            PREFIXOVEIC AS PREFIXO,
            PLACAATUALVEIC AS PLACA,
            CONDICAOVEIC AS STATUS,
            CODIGOTPFROTA AS TIPO_FROTA,
            CODIGOEMPRESA AS EMPRESA,
            CODIGOGA AS GARAGEM
        FROM GLOBUS.FRT_CADVEICULOS
        WHERE CODIGOEMPRESA = :empresa
          AND CODIGOGA = :garagem
          AND CONDICAOVEIC = 'A'
          AND (CODIGOTPFROTA NOT IN (12, 13) OR CODIGOTPFROTA IS NULL)
    """
    
    # 2. Query das OSs (Abertas/Em Andamento OU Abertas a partir de 01/01/2024)
    oracle_query_os = """
        SELECT 
            TO_CHAR(os.NUMEROOS) AS NUMERO_OS,
            TRIM(v.PREFIXOVEIC) AS VEICULO_PREFIXO,
            os.TIPOOS AS TIPO_RAW,
            os.CONDICAOOS AS STATUS_RAW,
            os.DATAABERTURAOS AS DATA_ABERTURA,
            os.DATAFECHAMENTOOS AS DATA_FECHAMENTO,
            SUBSTR(os.OBSERVACAOOS, 1, 500) AS DESCRICAO_SERVICO
        FROM GLOBUS.MAN_OS os
        JOIN GLOBUS.FRT_CADVEICULOS v ON os.CODIGOVEIC = v.CODIGOVEIC
        WHERE v.CODIGOEMPRESA = :empresa
          AND v.CODIGOGA = :garagem
          AND v.CONDICAOVEIC = 'A'
          AND (v.CODIGOTPFROTA NOT IN (12, 13) OR v.CODIGOTPFROTA IS NULL)
          AND (os.CONDICAOOS IN ('A', 'E') OR os.DATAABERTURAOS >= TO_DATE('2024-01-01', 'YYYY-MM-DD'))
        ORDER BY os.DATAABERTURAOS DESC
    """
    
    veiculos_raw = []
    os_raw = []
    
    try:
        conn = get_globus_connection()
        with conn.cursor() as cursor:
            # Extrair Frota
            cursor.execute(oracle_query_veiculos, empresa=settings.EMPRESA_CODIGO, garagem=settings.GARAGEM_CODIGO)
            cols_v = [col[0].lower() for col in cursor.description]
            for row in cursor.fetchall():
                veiculos_raw.append(dict(zip(cols_v, row)))
            
            # Extrair OSs
            cursor.execute(oracle_query_os, empresa=settings.EMPRESA_CODIGO, garagem=settings.GARAGEM_CODIGO)
            cols_os = [col[0].lower() for col in cursor.description]
            for row in cursor.fetchall():
                item = dict(zip(cols_os, row))
                item["tipo_manutencao"] = mapear_tipo_os(item.get("tipo_raw"))
                item["status_os"] = mapear_status_os(item.get("status_raw"))
                os_raw.append(item)
                
        conn.close()
    except Exception as e:
        logger.error(f"Erro na extração Oracle: {str(e)}")
        return {"status": "error", "message": str(e)}

    # AUDITORIA DE DADOS
    aprovado_v, veiculos_limpos, relatorio_v = DataAuditor.auditar_frota(veiculos_raw)
    if not aprovado_v:
        logger.error(f"Auditoria de Frota Rejeitada: {relatorio_v['erros']}")
        return {"status": "rejected", "relatorio": relatorio_v}

    prefixos_validos = {v["prefixo"] for v in veiculos_limpos}
    aprovado_os, os_limpas, relatorio_os = DataAuditor.auditar_ordens_servico(os_raw, prefixos_validos)

    # PERSISTÊNCIA EM LOTE NO POSTGRESQL (BULK UPSERT)
    async with AsyncSessionLocal() as db:
        # 1. Atualizar Veículos
        await db.execute(delete(Veiculo).where(Veiculo.prefixo.not_in(prefixos_validos)))
        for item in veiculos_limpos:
            res = await db.execute(select(Veiculo).where(Veiculo.prefixo == item["prefixo"]))
            v_exist = res.scalars().first()
            if v_exist:
                v_exist.placa = item["placa"]
                v_exist.status = item["status"]
            else:
                db.add(Veiculo(
                    prefixo=item["prefixo"],
                    placa=item["placa"],
                    modelo="Ônibus / JTU",
                    status=item["status"],
                    garagem="Garagem 2 - JTU"
                ))
        await db.flush()

        # 2. Bulk Upsert de OSs em Lotes de 1.000 registros
        if os_limpas:
            batch_size = 1000
            for i in range(0, len(os_limpas), batch_size):
                batch = os_limpas[i:i + batch_size]
                stmt = pg_insert(OrdemServico).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=['numero_os'],
                    set_={
                        'status_os': stmt.excluded.status_os,
                        'data_fechamento': stmt.excluded.data_fechamento,
                        'descricao_servico': stmt.excluded.descricao_servico,
                        'tipo_manutencao': stmt.excluded.tipo_manutencao
                    }
                )
                await db.execute(stmt)

        # 3. Log de Auditoria
        audit_entry = AuditLogSync(
            lidos_oracle=len(veiculos_raw) + len(os_raw),
            aprovados_auditoria=len(veiculos_limpos) + len(os_limpas),
            rejeitados=relatorio_v["rejeitados"] + relatorio_os["rejeitados"],
            status="SUCCESS",
            detalhes_anomalia={"frota": relatorio_v, "ordens_servico": relatorio_os}
        )
        db.add(audit_entry)
        await db.commit()

    logger.info(f"Sincronização concluída! {len(veiculos_limpos)} veículos e {len(os_limpas)} OSs processadas.")
    return {"status": "success", "veiculos": len(veiculos_limpos), "ordens_servico": len(os_limpas)}
