from fastapi import FastAPI, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession
import uvicorn

from app.db.session import AsyncSessionLocal, engine
from app.models.base import Base
import app.models
from app.models.auditoria import AuditLogSync
from app.api.frota import router as frota_router
from app.core.scheduler import start_scheduler
from app.services.globus_sync import sync_frota_globus

app = FastAPI(title="ConecttaOps API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()

app.include_router(frota_router)

@app.get("/")
async def read_root():
    return {"status": "online", "message": "Backend (FastAPI) Operante"}

@app.get("/api/health/db")
async def health_db(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Conexão com PostgreSQL estabelecida com sucesso!"}
    except Exception as e:
        return {"status": "error", "details": str(e)}

@app.get("/api/audit/logs")
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    """Retorna o histórico de auditoria das cargas de dados do Globus."""
    result = await db.execute(select(AuditLogSync).order_by(AuditLogSync.executado_em.desc()).limit(20))
    logs = result.scalars().all()
    return logs

@app.post("/api/sync/globus")
async def trigger_globus_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_frota_globus)
    return {"status": "started", "message": "Sincronização com Auditoria em segundo plano iniciada."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
