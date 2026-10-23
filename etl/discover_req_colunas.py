import os
import oracledb
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def listar_colunas():
    oracledb.init_oracle_client()
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    query_cols = """
        SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS 
        WHERE OWNER = 'GLOBUS' AND TABLE_NAME = 'EST_REQUISICAO'
    """

    try:
        with engine.connect() as conn:
            print("🔍 Colunas exatas em EST_REQUISICAO:")
            cols = conn.execute(text(query_cols)).fetchall()
            for c in cols:
                print(f" - {c[0]}")
                
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    listar_colunas()
