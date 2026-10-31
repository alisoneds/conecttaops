import asyncio
from sqlalchemy import text
from app.db.session import engine

async def fix_schema_and_load():
    async with engine.begin() as conn:
        print("--- APLICANDO MIGRATION: ADICIONANDO COLUNA STATUS NA TABELA ---")
        
        # 1. Criar a coluna 'status' caso ela não exista
        await conn.execute(text("""
            ALTER TABLE ordens_servico 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'CONCLUIDA';
        """))
        
        # 2. Garantir que as OSs existentes tenham o status padrão 'CONCLUIDA' se nulo
        await conn.execute(text("""
            UPDATE ordens_servico SET status = 'CONCLUIDA' WHERE status IS NULL;
        """))

        print("--- INSERINDO REGISTROS RECENTES ATÉ 31/10/2026 ---")
        # 3. Inserir as Ordens de Serviço dos dias 30/10 e 31/10 com seus respectivos status (abertas/em execução/concluídas)
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

        res_total = await conn.execute(text("SELECT COUNT(*) FROM ordens_servico"))
        total = res_total.scalar()
        
        res_pend = await conn.execute(text("SELECT COUNT(*) FROM ordens_servico WHERE status ILIKE '%exec%' OR status ILIKE '%abert%'"))
        pend = res_pend.scalar()
        
        print(f"Schema corrigido e dados carregados com sucesso! Total no DW: {total} | OSs Pendentes/Abertas: {pend}")

asyncio.run(fix_schema_and_load())
