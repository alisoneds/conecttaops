import os
import oracledb
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def buscar_descricoes():
    oracledb.init_oracle_client()
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    # Vamos listar as colunas e os dados da tabela MAN_ORIGEMOS
    query_colunas = """
        SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS 
        WHERE OWNER = 'GLOBUS' AND TABLE_NAME = 'MAN_ORIGEMOS'
    """
    
    try:
        with engine.connect() as conn:
            cols = [r[0] for r in conn.execute(text(query_colunas)).fetchall()]
            print(f"📋 Colunas em MAN_ORIGEMOS: {cols}")
            
            # Buscando todos os registros para mapear código -> descrição
            query_dados = "SELECT * FROM GLOBUS.MAN_ORIGEMOS"
            dados = conn.execute(text(query_dados)).fetchall()
            print("\n📋 Registros em MAN_ORIGEMOS:")
            for d in dados:
                print(d)
                
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    buscar_descricoes()
