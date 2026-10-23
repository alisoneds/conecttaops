import os
import oracledb
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def mapear_tabelas_novas():
    oracledb.init_oracle_client()
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    # Busca focada em Funcionários (FLP/MAN) e Materiais/Produtos do Estoque (EST)
    query = """
        SELECT TABLE_NAME 
        FROM ALL_TABLES 
        WHERE OWNER = 'GLOBUS' 
          AND (
              TABLE_NAME LIKE 'FLP_FUNC%' 
              OR TABLE_NAME LIKE 'MAN_%FUNC%' 
              OR (TABLE_NAME LIKE 'EST_%' AND (TABLE_NAME LIKE '%MAT%' OR TABLE_NAME LIKE '%PROD%'))
          )
        ORDER BY TABLE_NAME
    """
    
    try:
        print("\n🔍 Caçando tabelas de Funcionários e Cadastro de Materiais...")
        with engine.connect() as conn:
            resultados = conn.execute(text(query)).fetchall()
            
            if not resultados:
                print("⚠️ Nenhuma tabela encontrada.")
            else:
                for (table_name,) in resultados:
                    print(f"-> GLOBUS.{table_name}")
                print(f"\n✅ Total de tabelas listadas: {len(resultados)}")
                
    except Exception as e: 
        print(f"❌ Erro: {e}")

if __name__ == "__main__": 
    mapear_tabelas_novas()
