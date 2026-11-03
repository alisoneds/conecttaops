import asyncio
from sqlalchemy import text
from app.db.session import engine

async def fix_schema():
    async with engine.begin() as conn:
        print("--- CORRIGINDO TIPOS DAS COLUNAS BOMBA E TANQUE ---")
        await conn.execute(text("""
            ALTER TABLE abastecimentos ALTER COLUMN bomba TYPE VARCHAR(50) USING bomba::VARCHAR;
            ALTER TABLE abastecimentos ALTER COLUMN tanque TYPE VARCHAR(50) USING tanque::VARCHAR;
        """))
        print("✅ Colunas convertidas para VARCHAR com sucesso!")

asyncio.run(fix_schema())
