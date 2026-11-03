import asyncio
from sqlalchemy import text
from app.db.session import engine

async def update_nov_2026():
    async with engine.begin() as conn:
        print("--- INSERINDO REGISTROS RECENTES (01/11 A 03/11/2026) ---")
        
        # Inserção com numeração única garantida para evitar conflito de chave
        await conn.execute(text("""
            INSERT INTO ordens_servico (numero_os, veiculo_prefixo, data_abertura, status_os, status, tipo_manutencao, descricao_servico)
            VALUES 
                ('196025', '0001890', '2026-11-03 07:45:00'::timestamp, 'EM EXECUCAO', 'EM EXECUCAO', 'Corretiva', 'Troca de Pastilhas e Disco de Freio Dianteiro'),
                ('196022', '0003020', '2026-11-02 14:15:00'::timestamp, 'CONCLUIDA', 'CONCLUIDA', 'Preventiva', 'Revisão do Sistema Pneumático de Portas'),
                ('196018', '0001120', '2026-11-01 10:00:00'::timestamp, 'CONCLUIDA', 'CONCLUIDA', 'Corretiva', 'Substituição de Lâmpadas e Fusíveis do Farol')
            ON CONFLICT (numero_os) DO UPDATE SET 
                data_abertura = EXCLUDED.data_abertura,
                status_os = EXCLUDED.status_os,
                status = EXCLUDED.status,
                tipo_manutencao = EXCLUDED.tipo_manutencao,
                descricao_servico = EXCLUDED.descricao_servico;
        """))

        res = await conn.execute(text("""
            SELECT 
                COUNT(*) as total,
                MAX(data_abertura) as ultima_data,
                COUNT(CASE WHEN status IN ('ABERTA', 'EM EXECUCAO') THEN 1 END) as pendentes
            FROM ordens_servico;
        """))
        row = res.first()
        print(f"✅ Atualização concluída com sucesso!")
        print(f"✓ Total de OSs no DW: {row[0]}")
        print(f"✓ Última OS inserida em: {row[1]}")
        print(f"✓ OSs Pendentes/Em Execução: {row[2]}")

asyncio.run(update_nov_2026())
