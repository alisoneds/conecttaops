from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.db.session import AsyncSessionLocal
from app.models.abastecimento import Abastecimento

router = APIRouter(prefix="/api/abastecimento", tags=["Abastecimento e Quilometragem"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/")
async def listar_abastecimentos(
    prefixo: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    query = select(Abastecimento)
    if prefixo:
        query = query.where(Abastecimento.veiculo_prefixo == prefixo)
    query = query.order_by(Abastecimento.data_abastecimento.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/metrics")
async def metricas_abastecimento(db: AsyncSession = Depends(get_db)):
    """Retorna consolidados de combustível, km percorrida e média Km/L da frota."""
    total_litros = await db.scalar(select(func.sum(Abastecimento.litros))) or 0.0
    total_km = await db.scalar(select(func.sum(Abastecimento.km_rodado))) or 0.0
    total_registros = await db.scalar(select(func.count(Abastecimento.id))) or 0

    # Média Geral Km/L ponderada
    media_kml_geral = round(total_km / total_litros, 2) if total_litros > 0 else 0.0

    return {
        "total_litros": round(total_litros, 2),
        "total_km_rodado": round(total_km, 2),
        "media_kml_geral": media_kml_geral,
        "total_abastecimentos": total_registros
    }
