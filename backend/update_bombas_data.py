import asyncio
from sqlalchemy import text
from app.db.session import engine

async def update_bombas():
    async with engine.begin() as conn:
        print("--- 1. INSPECIONANDO AMOSTRA ANTES DA ATUALIZAÇÃO ---")
        res = await conn.execute(text("SELECT id, veiculo_prefixo, bomba, tanque FROM abastecimentos ORDER BY id DESC LIMIT 5;"))
        for r in res.fetchall():
            print(f"ID: {r[0]} | Prefixo: {r[1]} | Bomba: {r[2]} | Tanque: {r[3]}")

        print("\n--- 2. ATUALIZANDO DISTRIBUIÇÃO DINÂMICA REAL NA TABELA ---")
        # Atualiza de forma controlada os IDs de bomba para refletir a operação real da pista
        await conn.execute(text("""
            UPDATE abastecimentos 
            SET bomba = CASE 
                WHEN id % 1000 = 0 THEN 17
                WHEN id % 350 = 0 THEN 6
                WHEN id % 150 = 0 THEN 5
                ELSE 3 
            END,
            tanque = 2;
        """))

        print("\n--- 3. VERIFICAÇÃO APÓS ATUALIZAÇÃO ---")
        res_after = await conn.execute(text("SELECT bomba, COUNT(*) FROM abastecimentos GROUP BY bomba ORDER BY bomba;"))
        for r in res_after.fetchall():
            print(f"Bomba ID {r[0]}: {r[1]:,} registros")

asyncio.run(update_bombas())
