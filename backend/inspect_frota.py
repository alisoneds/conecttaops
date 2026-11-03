import asyncio
from sqlalchemy import text
from app.db.session import engine

async def inspect_veiculos():
    async with engine.begin() as conn:
        print("=== CONSULTA DIRETA AO DATAWAREHOUSE: TABELA VEICULOS ===")
        res = await conn.execute(text("""
            SELECT id, prefixo, COALESCE(placa, 'N/D'), COALESCE(ano_fabricacao, 0), 
                   COALESCE(fabricante, 'N/D'), COALESCE(modelo, 'N/D'), COALESCE(status, 'ATIVO')
            FROM veiculos 
            ORDER BY prefixo ASC;
        """))
        rows = res.fetchall()
        print(f"Total de veículos na tabela veiculos: {len(rows)}\n")
        print(f"{'ID':<5} | {'PREFIXO':<10} | {'PLACA':<10} | {'ANO':<6} | {'FABRICANTE / MODELO':<35} | {'STATUS':<8}")
        print("-" * 85)
        for r in rows:
            mod_fab = f"{r[4]} {r[3]}".strip()
            print(f"{r[0]:<5} | {r[1]:<10} | {r[2]:<10} | {r[3]:<6} | {mod_fab:<35} | {r[6]:<8}")

asyncio.run(inspect_veiculos())
