import logging
from sqlalchemy.future import select
from sqlalchemy import delete
from app.db.globus import get_globus_connection
from app.db.session import AsyncSessionLocal
from app.models.frota import Veiculo
from app.models.auditoria import AuditLogSync
from app.services.data_auditor import DataAuditor
from app.core.config import settings

logger = logging.getLogger("conecttaops.sync")

async def sync_frota_globus():
    logger.info("Iniciando extração do Globus para Staging com Auditoria...")
    
    oracle_query = """
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
    
    veiculos_raw = []
    
    try:
        conn = get_globus_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                oracle_query, 
                empresa=settings.EMPRESA_CODIGO, 
                garagem=settings.GARAGEM_CODIGO
            )
            columns = [col[0].lower() for col in cursor.description]
            for row in cursor.fetchall():
                veiculos_raw.append(dict(zip(columns, row)))
        conn.close()
    except Exception as e:
        logger.error(f"Erro de conexão/consulta Oracle: {str(e)}")
        return {"status": "error", "message": str(e)}

    # FASE DE AUDITORIA DE DADOS
    aprovado, veiculos_limpos, relatorio = DataAuditor.auditar_frota(veiculos_raw)

    async with AsyncSessionLocal() as db:
        if not aprovado:
            logger.error(f"Sincronização ABORTADA pelo Motor de Auditoria: {relatorio['erros']}")
            audit_entry = AuditLogSync(
                lidos_oracle=relatorio["total_lidos"],
                aprovados_auditoria=relatorio["aprovados"],
                rejeitados=relatorio["rejeitados"],
                status="REJECTED",
                detalhes_anomalia=relatorio
            )
            db.add(audit_entry)
            await db.commit()
            return {"status": "rejected", "relatorio": relatorio}

        # GRAVAÇÃO SEURA NO DATA WAREHOUSE (APÓS APROVAÇÃO)
        prefixos_validos = {v["prefixo"] for v in veiculos_limpos}
        
        # Expurgar do PostgreSQL veículos que saíram de circulação
        await db.execute(delete(Veiculo).where(Veiculo.prefixo.not_in(prefixos_validos)))

        for item in veiculos_limpos:
            result = await db.execute(select(Veiculo).where(Veiculo.prefixo == item["prefixo"]))
            veiculo_existente = result.scalars().first()

            if veiculo_existente:
                veiculo_existente.placa = item["placa"]
                veiculo_existente.status = item["status"]
            else:
                novo_veiculo = Veiculo(
                    prefixo=item["prefixo"],
                    placa=item["placa"],
                    modelo="Ônibus / JTU",
                    status=item["status"],
                    garagem="Garagem 2 - JTU"
                )
                db.add(novo_veiculo)

        # Registra sucesso na tabela de auditoria
        audit_entry = AuditLogSync(
            lidos_oracle=relatorio["total_lidos"],
            aprovados_auditoria=relatorio["aprovados"],
            rejeitados=relatorio["rejeitados"],
            status="SUCCESS",
            detalhes_anomalia=None
        )
        db.add(audit_entry)
        await db.commit()

    logger.info(f"Carga APROVADA e GRAVADA com sucesso: {len(veiculos_limpos)} veículos na JTU.")
    return {"status": "success", "processados": len(veiculos_limpos)}
