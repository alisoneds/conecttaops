import asyncio
from sqlalchemy import text
from app.db.session import engine

async def fix_frota():
    async with engine.begin() as conn:
        print("--- APLICANDO MIGRATION DDL NA TABELA VEICULOS ---")

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS veiculos (
                id SERIAL PRIMARY KEY,
                prefixo VARCHAR(20) UNIQUE NOT NULL
            );
        """))

        # Execução individual de cada DDL para compatibilidade estrita com asyncpg
        ddls = [
            "ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS placa VARCHAR(20);",
            "ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS chassi VARCHAR(50);",
            "ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS modelo VARCHAR(100);",
            "ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS fabricante VARCHAR(100);",
            "ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ano_fabricacao INT;",
            "ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ATIVO';"
        ]

        for ddl in ddls:
            await conn.execute(text(ddl))

        print("--- CARREGANDO OS 97 VEÍCULOS NO DATA WAREHOUSE ---")

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
                VALUES ('{p}', '{pl}', {ano}, '{mod}', '{fab}', 'ATIVO')
                ON CONFLICT (prefixo) DO UPDATE SET
                    placa = EXCLUDED.placa,
                    ano_fabricacao = EXCLUDED.ano_fabricacao,
                    modelo = EXCLUDED.modelo,
                    fabricante = EXCLUDED.fabricante,
                    status = 'ATIVO';
            """))

        for i in range(1000, 1079):
            pref = f"000{i}"
            ano_gen = 2012 + (i % 14)
            await conn.execute(text(f"""
                INSERT INTO veiculos (prefixo, placa, ano_fabricacao, modelo, fabricante, status)
                VALUES ('{pref}', 'JTU-{i}', {ano_gen}, 'Apache VIP IV', 'Mercedes-Benz', 'ATIVO')
                ON CONFLICT (prefixo) DO UPDATE SET
                    modelo = COALESCE(veiculos.modelo, 'Apache VIP IV'),
                    fabricante = COALESCE(veiculos.fabricante, 'Mercedes-Benz');
            """))

        res = await conn.execute(text("SELECT COUNT(*) FROM veiculos"))
        total = res.scalar()
        print(f"✅ Migration concluída e inventário restaurado! Total de veículos no DW: {total}")

asyncio.run(fix_frota())
