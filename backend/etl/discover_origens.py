import os
import oracledb
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def mapear_origens():
    oracledb.init_oracle_client()
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    # Consulta para buscar descrições de tabelas de origem de OS ou valores distintos na base
    query = """
        SELECT DISTINCT CODORIGOS 
        FROM GLOBUS.MAN_OS 
        WHERE CODIGOEMPRESA = 2 AND CODORIGOS IS NOT NULL
        ORDER BY CODORIGOS
    """
    
    # Tentativa de buscar tabela de cadastro de origem se existir
    query_tabela = """
        SELECT TABLE_NAME FROM ALL_TABLES 
        WHERE OWNER = 'GLOBUS' AND (TABLE_NAME LIKE '%ORIG%' OR TABLE_NAME LIKE '%CADORIG%')
    """

    try:
        with engine.connect() as conn:
            print("🔍 Códigos de Origem presentes nas OSs da Garagem 2:")
            res = conn.execute(text(query)).fetchall()
            for r in res:
                print(f" - Código: {r[0]}")
                
            print("\n🔍 Procurando tabelas de cadastro de origem no Globus:")
            tabs = conn.execute(text(query_tabela)).fetchall()
            for t in tabs:
                print(f" - Tabela encontrada: {t[0]}")
                
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    mapear_origens()
