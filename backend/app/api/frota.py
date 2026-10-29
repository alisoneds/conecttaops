from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import AsyncSessionLocal
from app.models.frota import Veiculo

router = APIRouter(prefix="/api/frota", tags=["Frota"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

class VeiculoCreate(BaseModel):
    prefixo: str
    placa: str
    modelo: str
    status: str = "Operacional"

@router.get("/")
async def listar_frota(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Veiculo))
    veiculos = result.scalars().all()
    return veiculos

@router.post("/")
async def cadastrar_veiculo(veiculo: VeiculoCreate, db: AsyncSession = Depends(get_db)):
    novo_veiculo = Veiculo(
        prefixo=veiculo.prefixo,
        placa=veiculo.placa,
        modelo=veiculo.modelo,
        status=veiculo.status
    )
    db.add(novo_veiculo)
    await db.commit()
    await db.refresh(novo_veiculo)
    return novo_veiculo
