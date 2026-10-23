import os
import logging
from dotenv import load_dotenv
import oracledb
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format="%(message)s")
load_dotenv()

def mapear_colunas():
    oracledb.init_oracle_client()
    
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    # Vamos puxar as colunas das 3 tabelas principais
    query = """
        SELECT TABLE_NAME, COLUMN_NAME 
        FROM ALL_TAB_COLUMNS 
        WHERE OWNER = 'GLOBUS' 
          AND TABLE_NAME IN ('MAN_OS', 'MAN_ITENSCAT', 'FRT_CADVEICULOS')
        ORDER BY TABLE_NAME, COLUMN_ID
    """

    try:
        print("\n🔍 Fazendo Raio-X das colunas do Globus (MAN_OS, MAN_ITENSCAT e FRT_CADVEICULOS)...")
        with engine.connect() as conn:
            resultados = conn.execute(text(query)).fetchall()
            
            if not resultados:
                print("⚠️ Nenhuma coluna encontrada.")
                return

            tabelas = {}
            for tab, col in resultados:
                if tab not in tabelas:
                    tabelas[tab] = []
                tabelas[tab].append(col)
                
            for tab, cols in tabelas.items():
                print(f"\n✅ TABELA: GLOBUS.{tab}")
                # Imprimindo em formato de lista separada por vírgula para facilitar a leitura
                print(", ".join(cols))
                
    except Exception as e:
        print(f"❌ Erro na consulta: {e}")

if __name__ == "__main__":
    mapear_colunas()
