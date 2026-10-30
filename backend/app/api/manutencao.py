from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
from datetime import datetime

from app.db.session import AsyncSessionLocal
from app.models.ordem_servico import OrdemServico

router = APIRouter(prefix="/api/v1/manutencao", tags=["Manutenção & OS"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/metrics")
async def metricas_manutencao(db: AsyncSession = Depends(get_db)):
    try:
        data_corte = datetime(2026, 1, 1)

        # OSs Pendentes (Abertas ou Em Andamento em 2026)
        res_pendentes = await db.execute(
            select(func.count(OrdemServico.id))
            .where(OrdemServico.data_abertura >= data_corte)
            .where(OrdemServico.status_os.in_(["Aberta", "Em Andamento"]))
        )
        oss_pendentes = res_pendentes.scalar() or 0

        # Total OSs registradas em 2026
        res_total = await db.execute(
            select(func.count(OrdemServico.id))
            .where(OrdemServico.data_abertura >= data_corte)
        )
        total_2026 = res_total.scalar() or 0

        # Concluídas em 2026
        res_concluidas = await db.execute(
            select(func.count(OrdemServico.id))
            .where(OrdemServico.data_abertura >= data_corte)
            .where(OrdemServico.status_os == "Concluida")
        )
        concluidas_2026 = res_concluidas.scalar() or 0

        return {
            "oss_pendentes": oss_pendentes,
            "total_oss_2026": total_2026,
            "concluidas_2026": concluidas_2026
        }
    except Exception as e:
        print(f"Erro em métricas de manutenção: {e}")
        return {"oss_pendentes": 0, "total_oss_2026": 0, "concluidas_2026": 0}

@router.get("/ordens")
async def listar_ordens(
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        data_corte = datetime(2026, 1, 1)
        query = select(OrdemServico).where(OrdemServico.data_abertura >= data_corte)

        if status and status != "TODOS":
            query = query.where(OrdemServico.status_os == status)
        if tipo and tipo != "TODOS":
            query = query.where(OrdemServico.tipo_manutencao == tipo)
        if search:
            search_fmt = f"%{search.strip().lower()}%"
            query = query.where(
                (func.lower(OrdemServico.numero_os).like(search_fmt)) |
                (func.lower(OrdemServico.veiculo_prefixo).like(search_fmt))
            )

        query = query.order_by(OrdemServico.data_abertura.desc()).limit(200)
        result = await db.execute(query)
        ordens = result.scalars().all()
        return ordens
    except Exception as e:
        print(f"Erro ao listar ordens de serviço: {e}")
        return []
