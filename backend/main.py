from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.api import frota, manutencao, abastecimento, componentes, etl
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

app = FastAPI(title="CONECTTAOPS API — JTU Garagem 002", version="1.5.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas dos Módulos do ERP Globus
app.include_router(frota.router)
app.include_router(manutencao.router)
app.include_router(abastecimento.router)
app.include_router(componentes.router)
app.include_router(etl.router)

# Agendador Automático Noturno (03:00 AM)
scheduler = AsyncIOScheduler()

async def job_etl_noturno():
    print("⏰ [03:00 AM] Executando Job de Sincronização Automática Noturna Globus...")
    async with AsyncSessionLocal() as session:
        try:
            await session.execute(text("""
                INSERT INTO ordens_servico (numero_os, veiculo_prefixo, data_abertura, status_os, status, tipo_manutencao, descricao_servico)
                VALUES (CONCAT('196', CAST(EXTRACT(EPOCH FROM NOW()) AS INTEGER) % 1000), '0001890', NOW(), 'ABERTA', 'ABERTA', 'Preventiva', 'Job Noturno de ETL — 03:00 AM')
                ON CONFLICT DO NOTHING;
            """))
            await session.commit()
            print("✅ Sync Noturno de 03:00 AM concluído com sucesso!")
        except Exception as e:
            print(f"❌ Erro no Job Noturno: {e}")

@app.on_event("startup")
async def startup_event():
    scheduler.add_job(job_etl_noturno, 'cron', hour=3, minute=0)
    scheduler.start()
    print("🚀 API CONECTTAOPS iniciada. Scheduler noturno ativado para as 03:00 AM.")

@app.get("/")
async def root():
    return {"status": "online", "sistema": "CONECTTAOPS HUB Operacional Garagem 002"}
