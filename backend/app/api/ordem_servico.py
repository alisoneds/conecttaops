from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.db.session import AsyncSessionLocal
from app.models.ordem_servico import OrdemServico

router = APIRouter(prefix="/api/os", tags=["Ordens de Serviço"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/")
async def listar_ordens_servico(
    prefixo: Optional[str] = None,
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    query = select(OrdemServico)
    if prefixo:
        query = query.where(OrdemServico.veiculo_prefixo == prefixo)
    if status:
        query = query.where(OrdemServico.status_os == status)
    if tipo:
        query = query.where(OrdemServico.tipo_manutencao == tipo)
    
    query = query.order_by(OrdemServico.data_abertura.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/metrics")
async def metricas_ordens_servico(db: AsyncSession = Depends(get_db)):
    """Retorna contadores operacionais de OS para o Dashboard."""
    total_abertas = await db.scalar(
        select(func.count(OrdemServico.id)).where(OrdemServico.status_os.in_(["Aberta", "Em Andamento"]))
    )
    total_preventivas = await db.scalar(
        select(func.count(OrdemServico.id)).where(OrdemServico.tipo_manutencao == "Preventiva")
    )
    total_corretivas = await db.scalar(
        select(func.count(OrdemServico.id)).where(OrdemServico.tipo_manutencao == "Corretiva")
    )

    return {
        "os_em_aberto": total_abertas or 0,
        "preventivas": total_preventivas or 0,
        "corretivas": total_corretivas or 0
    }
