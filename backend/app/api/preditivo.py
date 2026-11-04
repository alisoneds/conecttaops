from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from app.db.session import engine
from app.services.predictive_engine import executar_predicao_manutencao
import logging

router = APIRouter(prefix="/api/v1/preditivo", tags=["Inteligência Preditiva"])
logger = logging.getLogger(__name__)

class AlertaRequest(BaseModel):
    veiculo_prefixo: str
    nivel_risco: str
    recomendacao: str

async def get_db():
    async with AsyncSession(engine) as session:
        yield session

@router.get("/manutencao")
async def listar_predicoes_manutencao(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT id, veiculo_prefixo, nivel_risco, media_intervalo_dias, 
               ultima_os, data_ultima_intervencao, probabilidade_falha, recomendacao, atualizado_em
        FROM predicoes_manutencao
        ORDER BY probabilidade_falha DESC;
    """))
    rows = result.fetchall()
    
    predicoes = []
    for r in rows:
        predicoes.append({
            "id": r[0],
            "veiculo_prefixo": r[1],
            "nivel_risco": r[2],
            "media_intervalo_dias": float(r[3]) if r[3] else 0.0,
            "ultima_os": r[4],
            "data_ultima_intervencao": r[5].isoformat() if r[5] else None,
            "probabilidade_falha": float(r[6]) if r[6] else 0.0,
            "recomendacao": r[7],
            "atualizado_em": r[8].isoformat() if r[8] else None
        })
        
    return {"status": "success", "total": len(predicoes), "data": predicoes}

@router.post("/atualizar")
async def disparar_atualizacao_preditiva():
    try:
        await executar_predicao_manutencao()
        return {"status": "success", "message": "Análise preditiva atualizada com sucesso pelo Núcleo Local."}
    except Exception as e:
        logger.error(f"Erro ao executar predição manual: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/alerta")
async def abrir_alerta_preventivo(req: AlertaRequest):
    try:
        logger.info(f"--> ALERTA PREVENTIVO CRIADO | Veículo: {req.veiculo_prefixo} | Risco: {req.nivel_risco}")
        return {
            "status": "success",
            "message": f"Alerta preventivo aberto com sucesso para o veículo {req.veiculo_prefixo}!"
        }
    except Exception as e:
        logger.error(f"Erro ao abrir alerta preventivo: {e}")
        return {"status": "error", "message": str(e)}
