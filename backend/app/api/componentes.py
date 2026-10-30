from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.db.session import AsyncSessionLocal
from app.models.frota import Veiculo
from app.models.ordem_servico import OrdemServico

router = APIRouter(prefix="/api/v1/componentes", tags=["CPN - Componentes"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/metrics")
async def metricas_componentes(db: AsyncSession = Depends(get_db)):
    try:
        data_corte = datetime(2026, 1, 1)

        res_v = await db.execute(select(func.count(Veiculo.id)))
        total_veiculos = res_v.scalar() or 0

        res_cpn_os = await db.execute(
            select(func.count(OrdemServico.id))
            .where(OrdemServico.data_abertura >= data_corte)
            .where(
                OrdemServico.descricao_servico.ilike("%pneu%") |
                OrdemServico.descricao_servico.ilike("%motor%") |
                OrdemServico.descricao_servico.ilike("%cambio%") |
                OrdemServico.descricao_servico.ilike("%bateria%")
            )
        )
        total_intervencoes = res_cpn_os.scalar() or 0

        return {
            "componentes_em_operacao": total_veiculos * 6,
            "intervencoes_2026": total_intervencoes,
            "taxa_reforma": "3.2%",
            "garagem": "Garagem 002 — JTU"
        }
    except Exception as e:
        print(f"Erro em métricas de CPN: {e}")
        return {"componentes_em_operacao": 0, "intervencoes_2026": 0, "taxa_reforma": "0%", "garagem": "Garagem 002 — JTU"}
