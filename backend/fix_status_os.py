import asyncio
from sqlalchemy import text
from app.db.session import engine

async def fix_and_load():
    async with engine.begin() as conn:
        print("--- CORRIGINDO COLUNA STATUS_OS E PREENCHENDO REGISTROS ---")
        
        # 1. Atualizar registros existentes garantindo que status_os não fique nulo
        await conn.execute(text("""
            UPDATE ordens_servico 
            SET status_os = 'CONCLUIDA' 
            WHERE status_os IS NULL;
        """))

        # 2. Garantir coluna status para compatibilidade de rotas
        await conn.execute(text("""
            ALTER TABLE ordens_servico 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'CONCLUIDA';
        """))

        await conn.execute(text("""
            UPDATE ordens_servico 
            SET status = status_os 
            WHERE status IS NULL;
        """))

        print("--- INSERINDO REGISTROS RECENTES ATÉ 31/10/2026 ---")
        await conn.execute(text("""
            INSERT INTO ordens_servico (numero_os, veiculo_prefixo, data_abertura, status_os, status, tipo_manutencao, descricao_servico)
            VALUES 
                ('196014', '0001553', '2026-10-31 11:45:00', 'EM EXECUCAO', 'EM EXECUCAO', 'Corretiva', 'Alinhamento e Balanceamento de Rodas'),
                ('196012', '0003190', '2026-10-31 10:15:00', 'ABERTA', 'ABERTA', 'Preventiva', 'Revisão dos 10.000 Km — Frota Nova'),
                ('196010', '0002640', '2026-10-31 08:30:00', 'EM EXECUCAO', 'EM EXECUCAO', 'Corretiva', 'Serviço de Manutenção Elétrica'),
                ('196008', '0002740', '2026-10-30 16:40:00', 'CONCLUIDA', 'CONCLUIDA', 'Corretiva', 'Troca de Correia do Alternador'),
                ('196006', '0002440', '2026-10-30 09:20:00', 'CONCLUIDA', 'CONCLUIDA', 'Preventiva', 'Troca de Óleo e Filtros do Motor')
            ON CONFLICT DO NOTHING;
        """))

        res_total = await conn.execute(text("SELECT COUNT(*) FROM ordens_servico"))
        total = res_total.scalar()
        
        res_pend = await conn.execute(text("""
            SELECT COUNT(*) FROM ordens_servico 
            WHERE COALESCE(status_os, status, '') ILIKE '%exec%' 
               OR COALESCE(status_os, status, '') ILIKE '%abert%'
        """))
        pend = res_pend.scalar()
        
        print(f"Sucesso! Total no DW: {total} | OSs Pendentes/Em Execução: {pend}")

asyncio.run(fix_and_load())
