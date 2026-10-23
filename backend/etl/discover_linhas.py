import os
import oracledb
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def descobrir_linhas():
    oracledb.init_oracle_client()
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    query_tabelas = """
        SELECT TABLE_NAME FROM ALL_TABLES 
        WHERE OWNER = 'GLOBUS' AND (TABLE_NAME LIKE '%CADLINHA%' OR TABLE_NAME LIKE '%LINHA%')
    """

    try:
        with engine.connect() as conn:
            print("🔍 Tabelas de Linhas encontradas no Globus:")
            tabs = conn.execute(text(query_tabelas)).fetchall()
            for t in tabs:
                print(f" - {t[0]}")
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    descobrir_linhas()
