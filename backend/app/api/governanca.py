from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.auditoria import AuditLogSync

router = APIRouter(prefix="/api/v1/governanca", tags=["Governança & Sync"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/logs")
async def listar_logs_auditoria(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditLogSync).order_by(AuditLogSync.executado_em.desc()).limit(limit)
    )
    return result.scalars().all()

@router.get("/metrics")
async def metricas_governanca(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(
            func.count(AuditLogSync.id).label("total_execucoes"),
            func.sum(AuditLogSync.lidos_oracle).label("total_lidos"),
            func.sum(AuditLogSync.aprovados_auditoria).label("total_aprovados"),
            func.sum(AuditLogSync.rejeitados).label("total_rejeitados")
        )
    )
    row = res.first()

    res_last = await db.execute(
        select(AuditLogSync).order_by(AuditLogSync.executado_em.desc()).limit(1)
    )
    last_sync = res_last.scalars().first()

    return {
        "total_execucoes": row.total_execucoes or 0,
        "total_lidos": row.total_lidos or 0,
        "total_aprovados": row.total_aprovados or 0,
        "total_rejeitados": row.total_rejeitados or 0,
        "ultima_sincronizacao": last_sync.executado_em.isoformat() if last_sync else None,
        "ultimo_status": last_sync.status if last_sync else "N/A"
    }
