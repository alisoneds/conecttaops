import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.api.frota import router as frota_router
from app.api.manutencao import router as manutencao_router
from app.api.abastecimento import router as abastecimento_router
from app.api.componentes import router as componentes_router
from app.api.sync import router as sync_router
from app.api.preditivo import router as preditivo_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("conecttaops")

app = FastAPI(
    title="Conecttaops API",
    description="HUB Operacional e BI de Manutenção - Garagem 002 JTU",
    version="1.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(frota_router)
app.include_router(manutencao_router)
app.include_router(abastecimento_router)
app.include_router(componentes_router)
app.include_router(sync_router)
app.include_router(preditivo_router)

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    # 1. Carga ETL Globus (03:00 AM)
    try:
        from app.services.globus_sync import sync_frota_globus
        trigger_globus = CronTrigger(hour=3, minute=0)
        scheduler.add_job(sync_frota_globus, trigger_globus, id="daily_globus_sync", replace_existing=True)
        logger.info("--> Carga diária Globus programada para as 03:00 AM.")
    except Exception as e:
        logger.warning(f"--> Falha ao agendar Carga Globus: {e}")

    # 2. Recálculo da Inteligência Preditiva & MTBF (03:30 AM)
    try:
        from app.services.predictive_engine import executar_predicao_manutencao
        trigger_pred = CronTrigger(hour=3, minute=30)
        scheduler.add_job(executar_predicao_manutencao, trigger_pred, id="daily_predictive_calc", replace_existing=True)
        logger.info("--> Motor Preditivo (MTBF) programado para as 03:30 AM.")
    except Exception as e:
        logger.warning(f"--> Falha ao agendar Motor Preditivo: {e}")

    scheduler.start()
    logger.info("🚀 APScheduler ativado com sucesso: Carga Globus (03:00) -> Preditivo (03:30).")

@app.on_event("shutdown")
async def shutdown_event():
    if scheduler.running:
        scheduler.shutdown()

@app.get("/")
def read_root():
    return {"status": "online", "system": "Conecttaops HUB", "version": "1.4.0"}
