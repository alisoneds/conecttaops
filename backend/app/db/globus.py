import oracledb
from app.core.config import settings
import logging

logger = logging.getLogger("conecttaops.globus")

# Habilita o Thick Mode do Oracle Instant Client
try:
    oracledb.init_oracle_client(lib_dir="/opt/oracle/instantclient_19_23")
    logger.info("Oracle Instant Client (Thick Mode) inicializado com sucesso.")
except Exception as e:
    logger.warning(f"Aviso ao inicializar Thick Mode do Oracle: {str(e)}")

def get_globus_connection():
    """Cria conexão temporária em modo Thick com o banco Oracle do Globus."""
    try:
        connection = oracledb.connect(
            user=settings.GLOBUS_USER,
            password=settings.GLOBUS_PASSWORD,
            host=settings.GLOBUS_HOST,
            port=settings.GLOBUS_PORT,
            service_name=settings.GLOBUS_SERVICE_NAME
        )
        return connection
    except Exception as e:
        logger.error(f"Erro ao conectar no banco Oracle Globus: {str(e)}")
        raise e
