from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime

from app.db.session import AsyncSessionLocal
from app.models.frota import Veiculo
from app.models.ordem_servico import OrdemServico
from app.models.abastecimento import Abastecimento

router = APIRouter(prefix="/api/v1/frota", tags=["Gestão de Frota"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

def formatar_idade_veiculo(dt_inicio: Optional[datetime], ano_fab: Optional[int]) -> str:
    hoje = datetime.now()
    
    if dt_inicio:
        diff_anos = hoje.year - dt_inicio.year
        diff_meses = hoje.month - dt_inicio.month
        if hoje.day < dt_inicio.day:
            diff_meses -= 1
            
        total_meses = diff_anos * 12 + diff_meses
        if total_meses <= 0:
            return "1 mês"
            
        q_anos = total_meses // 12
        q_meses = total_meses % 12
        
        partes = []
        if q_anos == 1:
            partes.append("1 ano")
        elif q_anos > 1:
            partes.append(f"{q_anos} anos")
            
        if q_meses == 1:
            partes.append("1 mês")
        elif q_meses > 1:
            partes.append(f"{q_meses} meses")
            
        return " e ".join(partes) if partes else "1 mês"
        
    if ano_fab:
        q_anos = max(0, hoje.year - ano_fab)
        if q_anos == 0:
            # Caso o cadastro seja do ano corrente e não haja dia/mês
            diff_meses = max(1, hoje.month - 1)
            return f"{diff_meses} meses" if diff_meses > 1 else "1 mês"
        return f"{q_anos} ano" if q_anos == 1 else f"{q_anos} anos"

    return "N/A"

@router.get("/")
@router.get("")
async def listar_frota(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(Veiculo)
        if status and status != "TODOS":
            query = query.where(Veiculo.status == status)
        if search:
            search_fmt = f"%{search.strip().lower()}%"
            query = query.where(
                (func.lower(Veiculo.prefixo).like(search_fmt)) |
                (func.lower(Veiculo.placa).like(search_fmt))
            )
        query = query.order_by(Veiculo.prefixo.asc())
        result = await db.execute(query)
        veiculos = result.scalars().all()

        lista = []
        for v in veiculos:
            ano = v.ano_fabricacao or 2026
            idade_fmt = formatar_idade_veiculo(v.data_inicio_uso, ano)
            lista.append({
                "id": v.id,
                "prefixo": v.prefixo,
                "placa": v.placa or "Sem Placa",
                "modelo_chassis": v.modelo_chassis or "Mercedes-Benz OF-1721",
                "modelo_carroceria": v.modelo_carroceria or "Caio Apache VIP",
                "ano_fabricacao": ano,
                "idade_formatada": idade_fmt,
                "status": v.status or "Ativo",
                "garagem": v.garagem or "Garagem 2 - JTU"
            })
        return lista
    except Exception as e:
        print(f"Erro ao listar frota: {e}")
        return []

@router.get("/metrics")
async def metricas_frota(db: AsyncSession = Depends(get_db)):
    try:
        res_total = await db.execute(select(func.count(Veiculo.id)))
        total = res_total.scalar() or 0
        return {"total_veiculos": total}
    except Exception as e:
        print(f"Erro em métricas da frota: {e}")
        return {"total_veiculos": 0}

@router.get("/{prefixo}/raio-x")
async def raio_x_veiculo(prefixo: str, db: AsyncSession = Depends(get_db)):
    res_v = await db.execute(select(Veiculo).where(Veiculo.prefixo == prefixo))
    veiculo = res_v.scalars().first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    res_os = await db.execute(
        select(OrdemServico)
        .where(OrdemServico.veiculo_prefixo == prefixo)
        .order_by(OrdemServico.data_abertura.desc())
        .limit(5)
    )
    historico_os = res_os.scalars().all()

    res_abast = await db.execute(
        select(
            func.sum(Abastecimento.litros).label("total_litros"),
            func.sum(Abastecimento.km_rodado).label("total_km"),
            func.avg(Abastecimento.km_por_litro).label("media_kml"),
            func.count(Abastecimento.id).label("qtd_abastecimentos")
        )
        .where(Abastecimento.veiculo_prefixo == prefixo)
    )
    abast_data = res_abast.first()

    return {
        "veiculo": {
            "prefixo": veiculo.prefixo,
            "placa": veiculo.placa or "Sem Placa",
            "modelo_chassis": veiculo.modelo_chassis or "Mercedes-Benz OF-1721",
            "modelo_carroceria": veiculo.modelo_carroceria or "Caio Apache VIP",
            "garagem": veiculo.garagem or "Garagem 2 - JTU",
            "status": veiculo.status or "Ativo"
        },
        "historico_os": historico_os,
        "resumo_combustivel": {
            "total_litros": round(abast_data.total_litros or 0, 2) if abast_data else 0,
            "total_km": round(abast_data.total_km or 0, 2) if abast_data else 0,
            "media_kml": round(abast_data.media_kml or 0, 2) if abast_data else 0,
            "qtd_abastecimentos": abast_data.qtd_abastecimentos if abast_data else 0
        }
    }
