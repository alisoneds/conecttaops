import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)
load_dotenv()

def criar_schema_dw():
    pg_url = f"postgresql+psycopg2://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
    engine = create_engine(pg_url)

    # Nova DDL contemplando Descrição da Peça e Nome do Mecânico
    ddl_fact_os = """
    CREATE TABLE IF NOT EXISTS fact_ordens_servico (
        id_os INTEGER PRIMARY KEY,
        prefixo_veiculo VARCHAR(50),
        status_os VARCHAR(20),
        tipo_manutencao VARCHAR(50),
        origem_demanda VARCHAR(100),
        defeito_reclamado VARCHAR(255),
        nome_mecanico VARCHAR(150),
        descricao_peca VARCHAR(200),
        data_abertura TIMESTAMP,
        data_fechamento TIMESTAMP,
        custo_pecas NUMERIC(10, 2),
        tempo_atendimento_horas NUMERIC(10, 2),
        data_extracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    try:
        with engine.begin() as conn:
            # Caso a tabela anterior já exista sem essas colunas, fazemos um DROP para recriar limpa com a nova estrutura
            conn.execute(text("DROP TABLE IF EXISTS fact_ordens_servico;"))
            conn.execute(text(ddl_fact_os))
            logger.info("✅ Tabela 'fact_ordens_servico' recriada com sucesso no DW (com suporte a Mecânicos e Peças)!")
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar schema: {e}")

if __name__ == "__main__":
    criar_schema_dw()
