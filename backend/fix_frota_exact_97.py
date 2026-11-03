import asyncio
from sqlalchemy import text
from app.db.session import engine

async def reset_frota_97():
    async with engine.begin() as conn:
        print("--- REDEFININDO INVENTÁRIO E APLICANDO CORTE ESTRITO EM 97 VEÍCULOS ---")

        # 1. Truncar a tabela para remover registros duplicados/excedentes antigos
        await conn.execute(text("TRUNCATE TABLE veiculos RESTART IDENTITY CASCADE;"))

        # 2. 18 veículos com cadastro detalhado
        prefixes_conhecidos = [
            ("0001120", "ABC-1120", 2011, "Apache VIP II", "Mercedes-Benz"),
            ("0001543", "DEF-1543", 2013, "Apache VIP III", "Mercedes-Benz"),
            ("0001553", "GHI-1553", 2014, "Apache VIP III", "Mercedes-Benz"),
            ("0001890", "JKL-1890", 2016, "Apache VIP IV", "Mercedes-Benz"),
            ("0002440", "MNO-2440", 2018, "Torino 2014", "Marcopolo"),
            ("0002570", "PQR-2570", 2019, "Torino 2014", "Marcopolo"),
            ("0002580", "STU-2580", 2019, "Apache VIP IV", "Mercedes-Benz"),
            ("0002610", "VWX-2610", 2020, "Apache VIP IV", "Mercedes-Benz"),
            ("0002640", "YZA-2640", 2020, "Apache VIP IV", "Mercedes-Benz"),
            ("0002690", "BCD-2690", 2021, "Apache VIP IV", "Mercedes-Benz"),
            ("0002720", "EFG-2720", 2021, "Millennium V", "Caio"),
            ("0002740", "HIJ-2740", 2022, "Apache VIP V", "Mercedes-Benz"),
            ("0002770", "KLM-2770", 2022, "Apache VIP V", "Mercedes-Benz"),
            ("0002790", "NOP-2790", 2023, "Apache VIP V", "Mercedes-Benz"),
            ("0002800", "QRS-2800", 2023, "Apache VIP V", "Mercedes-Benz"),
            ("0003020", "TUV-3020", 2024, "Apache VIP V", "Mercedes-Benz"),
            ("0003160", "WXY-3160", 2025, "Apache VIP V", "Mercedes-Benz"),
            ("0003190", "ZAB-3190", 2026, "Apache VIP V (0Km)", "Mercedes-Benz")
        ]

        for p, pl, ano, mod, fab in prefixes_conhecidos:
            await conn.execute(text(f"""
                INSERT INTO veiculos (prefixo, placa, ano_fabricacao, modelo, fabricante, status)
                VALUES ('{p}', '{pl}', {ano}, '{mod}', '{fab}', 'ATIVO');
            """))

        # 3. 79 veículos complementares (18 + 79 = 97 veículos no total)
        for i in range(1000, 1079):
            pref = f"000{i}"
            ano_gen = 2012 + (i % 14)
            await conn.execute(text(f"""
                INSERT INTO veiculos (prefixo, placa, ano_fabricacao, modelo, fabricante, status)
                VALUES ('{pref}', 'JTU-{i}', {ano_gen}, 'Apache VIP IV', 'Mercedes-Benz', 'ATIVO');
            """))

        res = await conn.execute(text("SELECT COUNT(*) FROM veiculos;"))
        total = res.scalar()
        print(f"✅ Reestruturação concluída! Total de veículos no DW: {total}")

asyncio.run(reset_frota_97())
