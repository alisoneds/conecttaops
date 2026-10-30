import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.api.frota import router as frota_router
from app.api.manutencao import router as manutencao_router
from app.api.abastecimento import router as abastecimento_router
from app.api.componentes import router as componentes_router
from app.api.sync import router as sync_router, gov_router
from app.services.globus_sync import sync_frota_globus

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
app.include_router(gov_router)

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    trigger = CronTrigger(hour=3, minute=0)
    scheduler.add_job(sync_frota_globus, trigger, id="daily_globus_sync", replace_existing=True)
    scheduler.start()
    logger.info("--> Agendador automático iniciado: Carga Globus diária programada para as 03:00 AM.")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

@app.get("/")
def read_root():
    return {"status": "online", "system": "Conecttaops HUB", "version": "1.4.0"}
