import os
import logging
from dotenv import load_dotenv
import oracledb
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format="%(message)s")
load_dotenv()

def mapear_tabelas():
    oracledb.init_oracle_client()
    
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    # Busca tabelas com nomes chave no Globus, ignorando schemas de sistema padrão do Oracle
    query_discovery = """
        SELECT OWNER, TABLE_NAME 
        FROM ALL_TABLES 
        WHERE (TABLE_NAME LIKE '%TP_OS%' 
           OR TABLE_NAME LIKE '%CADVEIC%' 
           OR TABLE_NAME LIKE '%PECA%')
          AND OWNER NOT IN ('SYS', 'SYSTEM', 'XDB', 'WMSYS', 'OJVMSYS', 'CTXSYS', 'ORDSYS')
        ORDER BY OWNER, TABLE_NAME
    """

    try:
        print("\n🔍 Escaneando banco Oracle em busca das tabelas do Globus...")
        with engine.connect() as conn:
            resultados = conn.execute(text(query_discovery)).fetchall()
            
            if not resultados:
                print("⚠️ Nenhuma tabela parecida foi encontrada com esse usuário. Pode ser um problema de permissão (GRANT).")
            else:
                print("\n✅ Tabelas Encontradas:")
                print(f"{'SCHEMA (OWNER)':<20} | {'NOME DA TABELA':<30}")
                print("-" * 55)
                for owner, table_name in resultados:
                    print(f"{owner:<20} | {table_name:<30}")
                print("-" * 55)
                
    except Exception as e:
        print(f"❌ Erro na consulta: {e}")

if __name__ == "__main__":
    mapear_tabelas()
