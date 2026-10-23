import os
import logging
from dotenv import load_dotenv
import oracledb
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format="%(message)s")
load_dotenv()

def mapear_manutencao():
    oracledb.init_oracle_client()
    
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    # Varredura focada no módulo de Manutenção (MAN_) e Ordem de Serviço (OS)
    query = """
        SELECT TABLE_NAME 
        FROM ALL_TABLES 
        WHERE OWNER = 'GLOBUS' 
          AND (
              TABLE_NAME LIKE 'MAN_%' 
              OR TABLE_NAME LIKE '%ORDEM%'
              OR TABLE_NAME LIKE '%OS%'
          )
          -- Removendo ruídos comuns para limpar o log
          AND TABLE_NAME NOT LIKE '%POSICAO%'
        ORDER BY TABLE_NAME
    """

    try:
        print("\n🔍 Buscando tabelas de Manutenção (OS e Peças) no schema GLOBUS...")
        with engine.connect() as conn:
            resultados = conn.execute(text(query)).fetchall()
            
            if not resultados:
                print("⚠️ Nenhuma tabela de manutenção encontrada. Pode haver restrição de GRANT (Permissão).")
            else:
                for (table_name,) in resultados:
                    print(f"-> GLOBUS.{table_name}")
                print(f"\n✅ Total de tabelas listadas: {len(resultados)}")
                
    except Exception as e:
        print(f"❌ Erro na consulta: {e}")

if __name__ == "__main__":
    mapear_manutencao()
