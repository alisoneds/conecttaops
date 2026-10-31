import asyncio
from sqlalchemy import text
from app.db.session import engine

async def reload_data():
    async with engine.begin() as conn:
        print("--- ATUALIZANDO BASE DE MANUTENÇÃO (MAN) ATÉ 31/10/2026 ---")
        
        await conn.execute(text("""
            INSERT INTO ordens_servico (numero_os, veiculo_prefixo, data_abertura, status, tipo_manutencao, descricao_servico)
            VALUES 
                ('196014', '0001553', '2026-10-31 11:45:00', 'EM EXECUCAO', 'Corretiva', 'Alinhamento e Balanceamento de Rodas'),
                ('196012', '0003190', '2026-10-31 10:15:00', 'ABERTA', 'Preventiva', 'Revisão dos 10.000 Km — Frota Nova'),
                ('196010', '0002640', '2026-10-31 08:30:00', 'EM EXECUCAO', 'Corretiva', 'Serviço de Manutenção Elétrica'),
                ('196008', '0002740', '2026-10-30 16:40:00', 'CONCLUIDA', 'Corretiva', 'Troca de Correia do Alternador'),
                ('196006', '0002440', '2026-10-30 09:20:00', 'CONCLUIDA', 'Preventiva', 'Troca de Óleo e Filtros do Motor')
            ON CONFLICT DO NOTHING;
        """))

        res = await conn.execute(text("SELECT COUNT(*) FROM ordens_servico"))
        total = res.scalar()
        print(f"Base de dados atualizada! Total de OSs no DW: {total}")

asyncio.run(reload_data())
