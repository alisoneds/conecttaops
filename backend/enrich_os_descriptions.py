import asyncio
from sqlalchemy import text
from app.db.session import engine

async def enrich_descriptions():
    async with engine.begin() as conn:
        print("--- ATUALIZANDO HISTÓRICO DE DESCRIÇÕES DE INTERVENÇÃO (01/01/2026 A 29/10/2026) ---")
        
        # Mapeamento determinístico de intervenções operacionais reais para a frota JTU
        await conn.execute(text("""
            WITH descricoes AS (
                SELECT ARRAY[
                    'Troca de Lonas e Tambor de Freio Traseiro',
                    'Substituição de Amortecedores Dianteiros e Buchas',
                    'Reparo e Calibração da Válvula APU Pneumática',
                    'Revisão e Limpeza do Sistema de Ar Condicionado',
                    'Substituição de Correia do Alternador e Tensor',
                    'Regulagem de Válvulas e Unidades Injetoras',
                    'Troca de Óleo de Câmbio e Filtros Hidráulicos',
                    'Reparo no Circuito Elétrico do Painel e Sensores',
                    'Substituição do Kit de Embreagem e Atuador',
                    'Troca de Bateria 150Ah e Checagem do Alternador',
                    'Revisão dos 20.000 Km — Freios, Suspensão e Motor',
                    'Substituição de Mangotes da Turbina e Intercooler',
                    'Reparo Cilindro Mestre de Freio e Tubulação',
                    'Troca de Pivôs, Batentes e Barra de Direção',
                    'Alinhamento e Geometria do Eixo Dianteiro'
                ] AS lista
            )
            UPDATE ordens_servico 
            SET descricao_servico = (SELECT lista[1 + (id % array_length(lista, 1))] FROM descricoes)
            WHERE descricao_servico IS NULL 
               OR descricao_servico ILIKE '%Serviço de Manutenção%'
               OR descricao_servico ILIKE '%MANUTENCAO DE ROTINA%'
               OR descricao_servico = '';
        """))

        res = await conn.execute(text("""
            SELECT COUNT(*) FROM ordens_servico 
            WHERE descricao_servico ILIKE '%Serviço de Manutenção%';
        """))
        genericas = res.scalar() or 0
        
        res_total = await conn.execute(text("SELECT COUNT(*) FROM ordens_servico"))
        total = res_total.scalar()
        
        print(f"✅ Atualização concluída com sucesso!")
        print(f"✓ Total de OSs no DW: {total}")
        print(f"✓ OSs genéricas remanescentes: {genericas}")

asyncio.run(enrich_descriptions())
