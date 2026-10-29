from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
from app.services.globus_sync import sync_frota_globus

logger = logging.getLogger("conecttaops.scheduler")
scheduler = AsyncIOScheduler()

def start_scheduler():
    # Agenda a sincronização diária para as 3:00 AM (Horário de Brasília)
    scheduler.add_job(
        sync_frota_globus,
        trigger=CronTrigger(hour=3, minute=0),
        id="globus_daily_sync",
        name="Sincronização Diária Globus (Garagem 002 JTU)",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Agendador de tarefas ativo: Sincronização Globus configurada para todos os dias às 03:00 AM.")
