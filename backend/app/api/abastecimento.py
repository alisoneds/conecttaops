from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc
from typing import Optional
from datetime import datetime

from app.db.session import AsyncSessionLocal
from app.models.abastecimento import Abastecimento

router = APIRouter(prefix="/api/v1/abastecimento", tags=["ABA - Abastecimento"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/metrics")
async def metricas_abastecimento(db: AsyncSession = Depends(get_db)):
    try:
        data_corte = datetime(2026, 1, 1)
        res = await db.execute(
            select(
                func.sum(Abastecimento.litros).label("total_litros"),
                func.sum(Abastecimento.km_rodado).label("total_km"),
                func.count(Abastecimento.id).label("total_regs")
            ).where(Abastecimento.data_abastecimento >= data_corte)
        )
        row = res.first()
        total_litros = float(row.total_litros or 0) if row else 0.0
        total_km = float(row.total_km or 0) if row else 0.0
        
        # Média Ponderada Real: Total de Km / Total de Litros
        media_kml = (total_km / total_litros) if total_litros > 0 else 0.0

        return {
            "total_litros": round(total_litros, 2),
            "total_km": round(total_km, 2),
            "media_kml": round(media_kml, 2),
            "total_abastecimentos": row.total_regs if row else 0
        }
    except Exception as e:
        print(f"Erro em metricas de abastecimento: {e}")
        return {"total_litros": 0, "total_km": 0, "media_kml": 0, "total_abastecimentos": 0}

@router.get("/ranking-outliers")
async def ranking_outliers(db: AsyncSession = Depends(get_db)):
    try:
        data_corte = datetime(2026, 1, 1)
        
        # Piores desempenhos (Menor Km/L)
        res_piores = await db.execute(
            select(
                Abastecimento.veiculo_prefixo,
                (func.sum(Abastecimento.km_rodado) / func.sum(Abastecimento.litros)).label("media_kml"),
                func.sum(Abastecimento.litros).label("total_litros"),
                func.sum(Abastecimento.km_rodado).label("total_km")
            )
            .where(Abastecimento.data_abastecimento >= data_corte)
            .group_by(Abastecimento.veiculo_prefixo)
            .having(func.sum(Abastecimento.litros) > 50)
            .order_by(asc(func.sum(Abastecimento.km_rodado) / func.sum(Abastecimento.litros)))
            .limit(5)
        )
        piores = [
            {
                "prefixo": r.veiculo_prefixo,
                "media_kml": round(float(r.media_kml or 0), 2),
                "total_litros": round(float(r.total_litros or 0), 2),
                "total_km": round(float(r.total_km or 0), 2)
            }
            for r in res_piores.all()
        ]

        # Melhores desempenhos (Maior Km/L)
        res_melhores = await db.execute(
            select(
                Abastecimento.veiculo_prefixo,
                (func.sum(Abastecimento.km_rodado) / func.sum(Abastecimento.litros)).label("media_kml"),
                func.sum(Abastecimento.litros).label("total_litros"),
                func.sum(Abastecimento.km_rodado).label("total_km")
            )
            .where(Abastecimento.data_abastecimento >= data_corte)
            .group_by(Abastecimento.veiculo_prefixo)
            .having(func.sum(Abastecimento.litros) > 50)
            .order_by(desc(func.sum(Abastecimento.km_rodado) / func.sum(Abastecimento.litros)))
            .limit(5)
        )
        melhores = [
            {
                "prefixo": r.veiculo_prefixo,
                "media_kml": round(float(r.media_kml or 0), 2),
                "total_litros": round(float(r.total_litros or 0), 2),
                "total_km": round(float(r.total_km or 0), 2)
            }
            for r in res_melhores.all()
        ]

        return {"piores": piores, "melhores": melhores}
    except Exception as e:
        print(f"Erro no ranking de outliers: {e}")
        return {"piores": [], "melhores": []}

@router.get("/")
@router.get("")
async def listar_abastecimentos(
    prefixo: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    try:
        data_corte = datetime(2026, 1, 1)
        query = select(Abastecimento).where(Abastecimento.data_abastecimento >= data_corte)
        if prefixo:
            query = query.where(Abastecimento.veiculo_prefixo.ilike(f"%{prefixo.strip()}%"))
        query = query.order_by(desc(Abastecimento.data_abastecimento)).limit(limit)
        res = await db.execute(query)
        rows = res.scalars().all()
        
        resultado = []
        for a in rows:
            resultado.append({
                "id": a.id,
                "chave": a.chave_abastecimento,
                "prefixo": a.veiculo_prefixo,
                "data": a.data_abastecimento.strftime("%d/%m/%Y %H:%M") if a.data_abastecimento else "-",
                "litros": round(float(a.litros or 0), 2),
                "bomba": a.bomba or 1,
                "tanque": a.tanque or 1,
                "km_odometro": round(float(a.km_odometro or 0), 1),
                "km_rodado": round(float(a.km_rodado or 0), 1),
                "km_por_litro": round(float(a.km_por_litro or 0), 2)
            })
        return resultado
    except Exception as e:
        print(f"Erro ao listar abastecimentos: {e}")
        return []
