from sqlalchemy import Column, String, Integer, DateTime, JSON, Text
from datetime import datetime
from app.models.base import Base

class AuditLogSync(Base):
    __tablename__ = "audit_logs_sync"

    id = Column(Integer, primary_key=True, index=True)
    origem = Column(String(50), default="GLOBUS_ORACLE")
    empresa_garagem = Column(String(20), default="002/002")
    lidos_oracle = Column(Integer, nullable=False)
    aprovados_auditoria = Column(Integer, nullable=False)
    rejeitados = Column(Integer, default=0)
    status = Column(String(20), nullable=False) # SUCCESS, REJECTED, ERROR
    detalhes_anomalia = Column(JSON, nullable=True)
    executado_em = Column(DateTime, default=datetime.utcnow)
