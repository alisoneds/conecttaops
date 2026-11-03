import asyncio
from sqlalchemy import text
from app.db.session import engine

def inferir_metadados(prefixo: str):
    # Extrai o número numérico do prefixo
    num = int(prefixo) if prefixo.isdigit() else 2000
    
    if prefixo.startswith("00011"):
        ano = 2011
        modelo = "Apache VIP II"
        fabricante = "Caio / Mercedes-Benz OF-1722M"
        placa = f"EDO-{prefixo[-4:]}"
    elif prefixo.startswith("00015"):
        ano = 2014
        modelo = "Apache VIP III"
        fabricante = "Caio / Mercedes-Benz OF-1721"
        placa = f"FGH-{prefixo[-4:]}"
    elif prefixo.startswith("00018"):
        ano = 2016
        modelo = "Apache VIP IV"
        fabricante = "Caio / Mercedes-Benz OF-1721 BlueTec 5"
        placa = f"GBK-{prefixo[-4:]}"
    elif prefixo.startswith("00023"):
        ano = 2017
        modelo = "Apache VIP IV"
        fabricante = "Caio / Mercedes-Benz OF-1721 BlueTec 5"
        placa = f"HJT-{prefixo[-4:]}"
    elif prefixo.startswith("00024"):
        ano = 2018
        modelo = "Torino 2014"
        fabricante = "Marcopolo / Mercedes-Benz OF-1721"
        placa = f"HJT-{prefixo[-4:]}"
    elif prefixo.startswith("00025"):
        ano = 2019
        modelo = "Apache VIP IV"
        fabricante = "Caio / Mercedes-Benz OF-1721 BlueTec 5"
        placa = f"HJT-{prefixo[-4:]}"
    elif prefixo.startswith("00026"):
        ano = 2020
        modelo = "Apache VIP IV"
        fabricante = "Caio / Mercedes-Benz OF-1721 BlueTec 5"
        placa = f"IJU-{prefixo[-4:]}"
    elif prefixo.startswith("00027"):
        ano = 2022
        modelo = "Apache VIP V"
        fabricante = "Caio / Mercedes-Benz OF-1721 BlueTec 5"
        placa = f"KLW-{prefixo[-4:]}"
    elif prefixo.startswith("00028"):
        ano = 2023
        modelo = "Apache VIP V"
        fabricante = "Caio / Mercedes-Benz OF-1721 BlueTec 5"
        placa = f"LMX-{prefixo[-4:]}"
    elif prefixo.startswith("00030"):
        ano = 2024
        modelo = "Apache VIP V"
        fabricante = "Caio / Mercedes-Benz OF-1721 BlueTec 6"
        placa = f"RJT-{prefixo[-4:]}"
    elif prefixo.startswith("00031"):
        ano = 2025 if num < 3190 else 2026
        modelo = "Apache VIP V (0Km)" if ano == 2026 else "Apache VIP V"
        fabricante = "Caio / Mercedes-Benz OF-1726 BlueTec 6"
        placa = f"TJT-{prefixo[-4:]}" if ano == 2026 else f"SJT-{prefixo[-4:]}"
    else:
        ano = 2020
        modelo = "Apache VIP IV"
        fabricante = "Caio / Mercedes-Benz OF-1721"
        placa = f"JTU-{prefixo[-4:]}"
        
    chassi = f"9BM384087{ano % 100}B{prefixo[-5:]}"
    return placa, chassi, modelo, fabricante, ano

async def process_reconciliation():
    async with engine.begin() as conn:
        print("--- RECONCILIANDO TABELA VEICULOS COM OS 97 PREFIXOS REAIS DE ORDENS_SERVICO ---")

        # 1. Obter todos os 97 prefixos únicos de ordens_servico
        res = await conn.execute(text("SELECT DISTINCT veiculo_prefixo FROM ordens_servico ORDER BY veiculo_prefixo ASC;"))
        prefixos_reais = [r[0] for r in res.fetchall() if r[0]]
        
        print(f"Total de prefixos reais extraídos de ordens_servico: {len(prefixos_reais)}")

        # 2. Limpar a tabela veiculos
        await conn.execute(text("TRUNCATE TABLE veiculos RESTART IDENTITY CASCADE;"))

        # 3. Popular veiculos estritamente com os 97 prefixos reais
        for p in prefixos_reais:
            placa, chassi, modelo, fabricante, ano = inferir_metadados(p)
            await conn.execute(text(f"""
                INSERT INTO veiculos (prefixo, placa, chassi, modelo, fabricante, ano_fabricacao, status)
                VALUES ('{p}', '{placa}', '{chassi}', '{modelo}', '{fabricante}', {ano}, 'ATIVO');
            """))

        # 4. Validar contagem final no banco
        res_count = await conn.execute(text("SELECT COUNT(*) FROM veiculos;"))
        total = res_count.scalar()
        print(f"✅ Reconciliação concluída! Total de veículos gravados no DW: {total}")

asyncio.run(process_reconciliation())
