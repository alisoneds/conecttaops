import os
import oracledb
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def inspecionar_requisicao():
    oracledb.init_oracle_client()
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    query_cols = """
        SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS 
        WHERE OWNER = 'GLOBUS' AND TABLE_NAME = 'EST_REQUISICAO'
    """
    
    query_amostra = """
        SELECT * FROM (
            SELECT NUMERORQ, CODINTOS, TIPOREQ, SITUACAOREQ, VALORTOTALRQ 
            FROM GLOBUS.EST_REQUISICAO 
            WHERE CODIGOEMPRESA = 2 AND CODINTOS IS NOT NULL
        ) WHERE ROWNUM <= 5
    """

    try:
        with engine.connect() as conn:
            print("🔍 Colunas em EST_REQUISICAO:")
            cols = conn.execute(text(query_cols)).fetchall()
            for c in cols:
                print(f" - {c[0]}")
                
            print("\n🔍 Amostra de Requisições ligadas a OS:")
            amostra = conn.execute(text(query_amostra)).fetchall()
            for a in amostra:
                print(a)
                
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    inspecionar_requisicao()
