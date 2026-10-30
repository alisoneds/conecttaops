import asyncio
import logging
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.db.globus import get_globus_connection
from app.db.session import AsyncSessionLocal
from app.models.frota import Veiculo
from app.models.ordem_servico import OrdemServico
from app.models.abastecimento import Abastecimento
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

def _extrair_oracle_blocking():
    oracle_query_veiculos = """
        SELECT 
            TRIM(v.PREFIXOVEIC) AS PREFIXO, 
            TRIM(v.PLACAATUALVEIC) AS PLACA, 
            TRIM(v.CONDICAOVEIC) AS STATUS, 
            v.DTINICIOUTILVEIC AS DATA_INICIO_USO,
            EXTRACT(YEAR FROM v.DTINICIOUTILVEIC) AS ANO_FABRICACAO
        FROM GLOBUS.FRT_CADVEICULOS v
        WHERE v.CODIGOEMPRESA = :empresa 
          AND v.CODIGOGA = :garagem 
          AND v.CONDICAOVEIC = 'A' 
          AND (v.CODIGOTPFROTA NOT IN (12, 13) OR v.CODIGOTPFROTA IS NULL)
    """
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
          AND os.DATAABERTURAOS >= TO_DATE('2026-01-01', 'YYYY-MM-DD')
        ORDER BY os.DATAABERTURAOS DESC
    """
    oracle_query_abast = """
        SELECT 
            TRIM(v.PREFIXOVEIC) || '_' || TO_CHAR(a.DATAABASTCARRO, 'YYYYMMDD_HH24MISS') || '_' || TO_CHAR(NVL(a.SEQUENCIAABASTCARRO, 0)) AS CHAVE_ABASTECIMENTO, 
            TRIM(v.PREFIXOVEIC) AS VEICULO_PREFIXO, 
            a.DATAABASTCARRO AS DATA_ABASTECIMENTO, 
            NVL(a.QTDCOMB, 0) AS LITROS, 
            NVL(a.BBACOMB, 0) AS BOMBA, 
            NVL(a.TQUCOMB, 0) AS TANQUE,
            0 AS KM_RODADO,
            0 AS KM_ODOMETRO
        FROM GLOBUS.VWABA_CONFABASTCARRO a
        JOIN GLOBUS.FRT_CADVEICULOS v ON a.CODIGOVEIC = v.CODIGOVEIC
        WHERE v.CODIGOEMPRESA = :empresa 
          AND v.CODIGOGA = :garagem 
          AND v.CONDICAOVEIC = 'A' 
          AND (v.CODIGOTPFROTA NOT IN (12, 13) OR v.CODIGOTPFROTA IS NULL) 
          AND a.DATAABASTCARRO >= TO_DATE('2026-01-01', 'YYYY-MM-DD')
        ORDER BY a.DATAABASTCARRO DESC
    """
    veiculos_raw, os_raw, abast_raw = [], [], []
    conn = get_globus_connection()
    with conn.cursor() as cursor:
        cursor.execute(oracle_query_veiculos, empresa=settings.EMPRESA_CODIGO, garagem=settings.GARAGEM_CODIGO)
        cols_v = [col[0].lower() for col in cursor.description]
        for row in cursor.fetchall():
            item = dict(zip(cols_v, row))
            if item.get("prefixo"):
                item["status"] = "Ativo"
                item["modelo_chassis"] = "Mercedes-Benz OF-1721"
                item["modelo_carroceria"] = "Caio Apache VIP"
                item["ano_fabricacao"] = int(item.get("ano_fabricacao")) if item.get("ano_fabricacao") else 2018
                veiculos_raw.append(item)

        cursor.execute(oracle_query_os, empresa=settings.EMPRESA_CODIGO, garagem=settings.GARAGEM_CODIGO)
        cols_os = [col[0].lower() for col in cursor.description]
        for row in cursor.fetchall():
            item = dict(zip(cols_os, row))
            item["tipo_manutencao"] = mapear_tipo_os(item.get("tipo_raw"))
            item["status_os"] = mapear_status_os(item.get("status_raw"))
            os_raw.append(item)

        cursor.execute(oracle_query_abast, empresa=settings.EMPRESA_CODIGO, garagem=settings.GARAGEM_CODIGO)
        cols_ab = [col[0].lower() for col in cursor.description]
        for row in cursor.fetchall():
            abast_raw.append(dict(zip(cols_ab, row)))
    conn.close()
    return veiculos_raw, os_raw, abast_raw

async def sync_frota_globus():
    logger.info("Iniciando carga parametrizada com calculo exato de idade...")
    audit_id = None

    async with AsyncSessionLocal() as db:
        audit_entry = AuditLogSync(
            lidos_oracle=0, aprovados_auditoria=0, rejeitados=0,
            status="EM_ANDAMENTO", detalhes_anomalia={"status": "Extracao em andamento no Oracle..."}
        )
        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)
        audit_id = audit_entry.id

    try:
        veiculos_raw, os_raw, abast_raw = await asyncio.to_thread(_extrair_oracle_blocking)
        prefixos_validos = {v["prefixo"] for v in veiculos_raw}

        async with AsyncSessionLocal() as db:
            await db.execute(delete(Veiculo).where(Veiculo.prefixo.not_in(prefixos_validos)))
            for item in veiculos_raw:
                prefixo = item["prefixo"]
                res = await db.execute(select(Veiculo).where(Veiculo.prefixo == prefixo))
                v_exist = res.scalars().first()
                dt_inicio = item.get("data_inicio_uso")
                if v_exist:
                    v_exist.placa = item.get("placa") or "Sem Placa"
                    v_exist.modelo_chassis = item.get("modelo_chassis") or "Mercedes-Benz OF-1721"
                    v_exist.modelo_carroceria = item.get("modelo_carroceria") or "Caio Apache VIP"
                    v_exist.ano_fabricacao = item.get("ano_fabricacao") or 2018
                    v_exist.data_inicio_uso = dt_inicio
                    v_exist.status = "Ativo"
                else:
                    db.add(Veiculo(
                        prefixo=prefixo,
                        placa=item.get("placa") or "Sem Placa",
                        modelo_chassis=item.get("modelo_chassis") or "Mercedes-Benz OF-1721",
                        modelo_carroceria=item.get("modelo_carroceria") or "Caio Apache VIP",
                        ano_fabricacao=item.get("ano_fabricacao") or 2018,
                        data_inicio_uso=dt_inicio,
                        status="Ativo",
                        garagem="Garagem 2 - JTU"
                    ))
            await db.commit()

        aprovado_os, os_limpas, relatorio_os = DataAuditor.auditar_ordens_servico(os_raw, prefixos_validos)
        aprovado_ab, abast_limpos, relatorio_ab = DataAuditor.auditar_abastecimentos(abast_raw, prefixos_validos)

        os_limpas_unique = list({item["numero_os"]: item for item in os_limpas}.values())
        abast_limpos_unique = list({item["chave_abastecimento"]: item for item in abast_limpos}.values())

        async with AsyncSessionLocal() as db:
            await db.execute(delete(OrdemServico).where(OrdemServico.data_abertura < '2026-01-01'))
            await db.execute(delete(Abastecimento).where(Abastecimento.data_abastecimento < '2026-01-01'))

            if os_limpas_unique:
                for i in range(0, len(os_limpas_unique), 1000):
                    batch = os_limpas_unique[i:i + 1000]
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

            if abast_limpos_unique:
                for i in range(0, len(abast_limpos_unique), 1000):
                    batch = abast_limpos_unique[i:i + 1000]
                    stmt = pg_insert(Abastecimento).values(batch)
                    stmt = stmt.on_conflict_do_update(
                        index_elements=['chave_abastecimento'],
                        set_={
                            'litros': stmt.excluded.litros,
                            'km_odometro': stmt.excluded.km_odometro,
                            'km_rodado': stmt.excluded.km_rodado,
                            'km_por_litro': stmt.excluded.km_por_litro,
                            'bomba': stmt.excluded.bomba,
                            'tanque': stmt.excluded.tanque
                        }
                    )
                    await db.execute(stmt)

            res_audit = await db.execute(select(AuditLogSync).where(AuditLogSync.id == audit_id))
            audit_log = res_audit.scalars().first()
            if audit_log:
                audit_log.lidos_oracle = len(veiculos_raw) + len(os_raw) + len(abast_raw)
                audit_log.aprovados_auditoria = len(veiculos_raw) + len(os_limpas_unique) + len(abast_limpos_unique)
                audit_log.rejeitados = relatorio_os["rejeitados"] + relatorio_ab["rejeitados"]
                audit_log.status = "SUCCESS"
                audit_log.detalhes_anomalia = {"ordens_servico": relatorio_os, "abastecimentos": relatorio_ab}
            await db.commit()

        logger.info("Sincronização concluída com sucesso.")
        return {"status": "success"}

    except Exception as e:
        logger.error(f"Erro no processamento ETL: {str(e)}")
        async with AsyncSessionLocal() as db:
            res_audit = await db.execute(select(AuditLogSync).where(AuditLogSync.id == audit_id))
            audit_log = res_audit.scalars().first()
            if audit_log:
                audit_log.status = "ERROR"
                audit_log.detalhes_anomalia = {"erro": str(e)}
                await db.commit()
        return {"status": "error", "message": str(e)}
