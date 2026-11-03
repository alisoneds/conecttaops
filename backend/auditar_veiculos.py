import asyncio
from sqlalchemy import text
from app.db.session import engine

async def auditar_estrutura_e_dados():
    async with engine.begin() as conn:
        print("=== AUDITORIA COMPLETA DOS ABASTECIMENTOS ===")
        query = text("""
            SELECT 
                COUNT(id) AS total_eventos_abastecimento,
                COALESCE(SUM(litros), 0) AS total_litros_consumidos,
                COALESCE(SUM(km_rodado), 0) AS quilometragem_total_rodada,
                ROUND((COALESCE(SUM(km_rodado), 0) / NULLIF(SUM(litros), 0))::numeric, 2) AS media_geral_frota_kml
            FROM abastecimentos;
        """)
        res = await conn.execute(query)
        row = res.first()
        if row:
            print(f"Total de eventos de abastecimento: {row[0]:,}")
            print(f"Total de litros consumidos: {row[1]:,.2f} L")
            print(f"Quilometragem total rodada: {row[2]:,.2f} Km")
            print(f"Média geral da frota (Km/L): {row[3]}")

asyncio.run(auditar_estrutura_e_dados())
