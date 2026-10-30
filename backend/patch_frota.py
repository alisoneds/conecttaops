import asyncio
from sqlalchemy import text
from app.db.session import engine

async def fix_data():
    async with engine.begin() as conn:
        await conn.execute(text("""
            UPDATE veiculos 
            SET data_fabricacao = '2026-06-01' 
            WHERE prefixo IN ('0003140', '3140', '0003150', '3150', '0003160', '3160', '0003170', '3170', '0003180', '3180', '0003190', '3190');
        """))
        print("Patch aplicado com sucesso: Veiculos atualizados para 01/06/2026.")

asyncio.run(fix_data())
