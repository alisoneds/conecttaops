import os

class Settings:
    PROJECT_NAME: str = "ConecttaOps"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://admin:adminpassword@db:5432/conecttaops_dw"
    )
    
    # Credenciais Globus (Oracle) injetadas via Docker Environment
    GLOBUS_HOST: str = os.getenv("GLOBUS_HOST", "192.168.50.208")
    GLOBUS_PORT: int = int(os.getenv("GLOBUS_PORT", "1521"))
    GLOBUS_SERVICE_NAME: str = os.getenv("GLOBUS_SERVICE_NAME", "ORACLE")
    GLOBUS_USER: str = os.getenv("GLOBUS_USER", "usr_dashboard")
    GLOBUS_PASSWORD: str = os.getenv("GLOBUS_PASSWORD", "Jtu#2026ubt")
    
    # Regra de Ouro: Empresa / Garagem 002 (JTU)
    EMPRESA_CODIGO: int = int(os.getenv("EMPRESA_CODIGO", "2"))
    GARAGEM_CODIGO: int = int(os.getenv("GARAGEM_CODIGO", "2"))

settings = Settings()
