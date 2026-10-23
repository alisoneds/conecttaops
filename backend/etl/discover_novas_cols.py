import os
import oracledb
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def mapear_colunas():
    oracledb.init_oracle_client()
    oracle_url = f"oracle+oracledb://{os.getenv('ORACLE_USER')}:{os.getenv('ORACLE_PASS')}@{os.getenv('ORACLE_HOST')}:{os.getenv('ORACLE_PORT')}/{os.getenv('ORACLE_SERVICE')}"
    engine = create_engine(oracle_url)

    query = """
        SELECT TABLE_NAME, COLUMN_NAME 
        FROM ALL_TAB_COLUMNS 
        WHERE OWNER = 'GLOBUS' 
          AND TABLE_NAME IN ('EST_CADMATERIAL', 'MAN_OSFUNCIONARIOS', 'FLP_FUNCIONARIOS')
        ORDER BY TABLE_NAME, COLUMN_ID
    """
    try:
        print("\n🔍 Mapeando colunas de Materiais e Funcionários...")
        with engine.connect() as conn:
            resultados = conn.execute(text(query)).fetchall()
            
            tabelas = {}
            for tab, col in resultados:
                if tab not in tabelas: tabelas[tab] = []
                tabelas[tab].append(col)
                
            for tab, cols in tabelas.items():
                print(f"\n✅ TABELA: GLOBUS.{tab}")
                print(", ".join(cols))
                
    except Exception as e: 
        print(f"❌ Erro: {e}")

if __name__ == "__main__": 
    mapear_colunas()
