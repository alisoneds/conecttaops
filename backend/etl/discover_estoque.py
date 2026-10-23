import os
import oracledb
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def mapear_estoque():
    oracledb.init_oracle_client()
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    query_tabelas = """
        SELECT TABLE_NAME FROM ALL_TABLES 
        WHERE OWNER = 'GLOBUS' AND TABLE_NAME LIKE 'EST_%'
    """
    
    query_col_itens = """
        SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS 
        WHERE OWNER = 'GLOBUS' AND TABLE_NAME = 'EST_ITENSREQUISICAO'
    """

    try:
        with engine.connect() as conn:
            print("🔍 Tabelas de Estoque encontradas no Globus:")
            tabs = conn.execute(text(query_tabelas)).fetchall()
            for t in tabs:
                print(f" - {t[0]}")
                
            print("\n🔍 Colunas em EST_ITENSREQUISICAO:")
            cols = conn.execute(text(query_col_itens)).fetchall()
            for c in cols:
                print(f" - {c[0]}")
                
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    mapear_estoque()
