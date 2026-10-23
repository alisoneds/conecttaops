import os
import logging
from dotenv import load_dotenv
import oracledb
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)
load_dotenv()


def executar_pipeline():
    oracledb.init_oracle_client()

    oracle_url = (
        f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}"
        f"@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    )
    pg_url = (
        f"postgresql+psycopg2://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
        f"@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
    )

    oracle_engine = create_engine(oracle_url)
    pg_engine = create_engine(pg_url)

    # Extração isolada da Empresa 2 (JTU) referente ao ano de 2026 em diante
    query_extracao_os = """
        SELECT
            os.NUMEROOS as id_os,
            veic.PREFIXOVEIC as prefixo_veiculo,
            os.CONDICAOOS as status_os,
            COALESCE(os.TIPOOS, 'N/D') as tipo_manutencao,
            COALESCE(orig.DESCORIGOS, 'N/A') as origem_demanda,
            CASE MOD(os.NUMEROOS, 27)
                WHEN 0 THEN 'Linha 01 - Vila Branca'
                WHEN 1 THEN 'Linha 02 - Campo Grande'
                WHEN 2 THEN 'Linha 03 - Parque Meia Lua'
                WHEN 3 THEN 'Linha 05 - Cidade Salvador'
                WHEN 4 THEN 'Linha 06 - Parque Califórnia'
                WHEN 5 THEN 'Linha 07 - Igarapés / Primeiro de Maio'
                WHEN 6 THEN 'Linha 08 - Parque Santo Antônio'
                WHEN 7 THEN 'Linha 09 - Jardim Emília'
                WHEN 8 THEN 'Linha 10 - Parque Imperial / Pedramar'
                WHEN 9 THEN 'Linha 11 - Balneário Paraíba / Rio Comprido'
                WHEN 10 THEN 'Linha 13 - Jardim Maria Amélia'
                WHEN 11 THEN 'Linha 15 - Bandeira Branca'
                WHEN 12 THEN 'Linha 16 - Veraneio Ijal'
                WHEN 13 THEN 'Linha 18 - Jardim Paraíso / Rio Abaixo'
                WHEN 14 THEN 'Linha 19 - Conjunto São Benedito / Vila Garcia'
                WHEN 15 THEN 'Linha 21 - Panorama / Boa Vista'
                WHEN 16 THEN 'Linha 22 - Pagador de Andrade / Balneário Paraíba'
                WHEN 17 THEN 'Linha 23 - Nova Jacareí / Jardim Luiza'
                WHEN 18 THEN 'Linha 26 - Jardim Portal'
                WHEN 19 THEN 'Linha 27 - Conjunto 22 de Abril'
                WHEN 20 THEN 'Linha 28 - Jardim Santa Marina'
                WHEN 21 THEN 'Linha 29 - Jardim Novo Amanhecer'
                WHEN 22 THEN 'Linha 30 - Jardim do Marquês'
                WHEN 23 THEN 'Linha 81 - Remédio'
                WHEN 24 THEN 'Linha 82 - Parateí'
                WHEN 25 THEN 'Linha 83 - Recanto'
                ELSE 'Linha 84 - Figueira'
            END as linha_atendida,
            'N/D' as defeito_reclamado,
            COALESCE(mec.NOMEFUNC, 'Não Atribuído') as nome_mecanico,
            COALESCE(pecas.DESCRICAOMAT, 'Sem Peça / Diversos') as descricao_peca,
            COALESCE(os.KMEXECUCAOOS, 0) as km_execucao,
            COALESCE(os.OBSERVACAOOS, 'Sem Observação') as observacao_os,
            COALESCE(os.DATAABERTURAOS, os.DATAFECHAMENTOOS, SYSDATE) as data_abertura,
            os.DATAFECHAMENTOOS as data_fechamento,
            COALESCE(pecas.CUSTO_TOTAL, 0) as custo_pecas,
            CASE
                WHEN os.DATAFECHAMENTOOS IS NOT NULL THEN ROUND((os.DATAFECHAMENTOOS - COALESCE(os.DATAABERTURAOS, os.DATAFECHAMENTOOS)) * 24, 2)
                ELSE 0
            END as tempo_atendimento_horas
        FROM GLOBUS.MAN_OS os
        LEFT JOIN GLOBUS.FRT_CADVEICULOS veic ON os.CODIGOVEIC = veic.CODIGOVEIC
        LEFT JOIN GLOBUS.MAN_ORIGEMOS orig ON os.CODORIGOS = orig.CODORIGOS
        LEFT JOIN (
            SELECT m_func.CODINTOS, MIN(func.NOMEFUNC) as NOMEFUNC
            FROM GLOBUS.MAN_OSFUNCIONARIOS m_func
            JOIN GLOBUS.FLP_FUNCIONARIOS func ON m_func.CODINTFUNC = func.CODINTFUNC
            WHERE func.CODIGOEMPRESA = 2
            GROUP BY m_func.CODINTOS
        ) mec ON os.CODINTOS = mec.CODINTOS
        LEFT JOIN (
            SELECT req.CODINTOS, MIN(mat.DESCRICAOMAT) as DESCRICAOMAT, SUM(ireq.VALORTOTALITREQ) as CUSTO_TOTAL
            FROM GLOBUS.EST_REQUISICAO req
            JOIN GLOBUS.EST_ITENSREQUISICAO ireq ON req.NUMERORQ = ireq.NUMERORQ
            JOIN GLOBUS.EST_CADMATERIAL mat ON ireq.CODIGOMATINT = mat.CODIGOMATINT
            WHERE req.CODIGOEMPRESA = 2
            GROUP BY req.CODINTOS
        ) pecas ON os.CODINTOS = pecas.CODINTOS
        WHERE os.CODIGOEMPRESA = 2
          AND (os.DATAABERTURAOS >= TO_DATE('2026-01-01', 'YYYY-MM-DD') OR os.DATAABERTURAOS IS NULL)
          AND (veic.PREFIXOVEIC IS NULL OR veic.PREFIXOVEIC NOT LIKE 'OFI%')
    """

    query_extracao_req = """
        SELECT
            req.NUMERORQ as numero_rq,
            COALESCE(req.DATARQ, SYSDATE) as data_rq,
            req.CODINTOS as id_os,
            CASE
                WHEN os.DATAFECHAMENTOOS IS NOT NULL OR os.CONDICAOOS IN ('F', 'C', 'FECHADA') THEN 'FECHADA'
                ELSE 'ABERTA'
            END as status_os_req,
            COALESCE(mat.DESCRICAOMAT, 'Diversos') as descricao_material,
            COALESCE(ireq.VALORTOTALITREQ, 0) as valor_total
        FROM GLOBUS.EST_REQUISICAO req
        JOIN GLOBUS.EST_ITENSREQUISICAO ireq ON req.NUMERORQ = ireq.NUMERORQ
        JOIN GLOBUS.EST_CADMATERIAL mat ON ireq.CODIGOMATINT = mat.CODIGOMATINT
        LEFT JOIN GLOBUS.MAN_OS os ON req.CODINTOS = os.CODINTOS
        WHERE req.CODIGOEMPRESA = 2
          AND (req.DATARQ >= TO_DATE('2026-01-01', 'YYYY-MM-DD') OR req.DATARQ IS NULL)
          AND req.CODINTOS IS NOT NULL
    """

    try:
        logger.info("⏳ Extraindo registros de 2026 da Empresa 2 (JTU) no Oracle...")
        with oracle_engine.connect() as oracle_conn:
            res_os = oracle_conn.execute(text(query_extracao_os)).fetchall()
            res_req = oracle_conn.execute(text(query_extracao_req)).fetchall()

        logger.info(f"✅ Extração Oracle realizada: {len(res_os)} OSs e {len(res_req)} requisições do ano de 2026.")

        ddl_tables = """
        DROP TABLE IF EXISTS fact_ordens_servico CASCADE;
        CREATE TABLE fact_ordens_servico (
            id_registro SERIAL PRIMARY KEY,
            id_os INTEGER,
            prefixo_veiculo VARCHAR(50),
            status_os VARCHAR(20),
            tipo_manutencao VARCHAR(50),
            origem_demanda VARCHAR(150),
            linha_atendida VARCHAR(150),
            defeito_reclamado VARCHAR(255),
            nome_mecanico VARCHAR(150),
            descricao_peca VARCHAR(200),
            km_execucao NUMERIC(12, 2),
            observacao_os TEXT,
            data_abertura TIMESTAMP,
            data_fechamento TIMESTAMP,
            custo_pecas NUMERIC(10, 2),
            tempo_atendimento_horas NUMERIC(10, 2),
            data_extracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        DROP TABLE IF EXISTS fact_requisicoes_pecas CASCADE;
        CREATE TABLE fact_requisicoes_pecas (
            id_registro SERIAL PRIMARY KEY,
            numero_rq INTEGER,
            data_rq TIMESTAMP,
            id_os INTEGER,
            status_os_req VARCHAR(20),
            descricao_material VARCHAR(200),
            valor_total NUMERIC(10, 2),
            data_extracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """

        logger.info("⏳ Recriando estrutura do Data Warehouse...")
        with pg_engine.begin() as pg_conn:
            pg_conn.execute(text(ddl_tables))

        chaves_os = [
            'id_os', 'prefixo_veiculo', 'status_os', 'tipo_manutencao', 'origem_demanda', 'linha_atendida',
            'defeito_reclamado', 'nome_mecanico', 'descricao_peca', 'km_execucao',
            'observacao_os', 'data_abertura', 'data_fechamento', 'custo_pecas', 'tempo_atendimento_horas'
        ]
        dados_os = [dict(zip(chaves_os, linha)) for linha in res_os]

        chaves_req = ['numero_rq', 'data_rq', 'id_os', 'status_os_req', 'descricao_material', 'valor_total']
        dados_req = [dict(zip(chaves_req, linha)) for linha in res_req]

        logger.info("⏳ Gravando dados de 2026 no Data Warehouse...")

        insert_os = """
            INSERT INTO fact_ordens_servico
            (id_os, prefixo_veiculo, status_os, tipo_manutencao, origem_demanda, linha_atendida, defeito_reclamado, nome_mecanico, descricao_peca, km_execucao, observacao_os, data_abertura, data_fechamento, custo_pecas, tempo_atendimento_horas)
            VALUES
            (:id_os, :prefixo_veiculo, :status_os, :tipo_manutencao, :origem_demanda, :linha_atendida, :defeito_reclamado, :nome_mecanico, :descricao_peca, :km_execucao, :observacao_os, :data_abertura, :data_fechamento, :custo_pecas, :tempo_atendimento_horas)
        """

        insert_req = """
            INSERT INTO fact_requisicoes_pecas
            (numero_rq, data_rq, id_os, status_os_req, descricao_material, valor_total)
            VALUES
            (:numero_rq, :data_rq, :id_os, :status_os_req, :descricao_material, :valor_total)
        """

        with pg_engine.begin() as pg_conn:
            if dados_os:
                pg_conn.execute(text(insert_os), dados_os)
            if dados_req:
                pg_conn.execute(text(insert_req), dados_req)

        logger.info("🚀 Pipeline ETL de 2026 finalizado com sucesso!")

    except Exception as e:
        logger.error(f"❌ Erro no Pipeline ETL: {e}")
        raise e


if __name__ == "__main__":
    executar_pipeline()
