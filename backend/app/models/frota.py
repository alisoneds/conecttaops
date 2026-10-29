from sqlalchemy import Column, String, Integer, DateTime
from datetime import datetime
from app.models.base import Base

class Veiculo(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True)
    prefixo = Column(String(20), unique=True, index=True, nullable=False)
    placa = Column(String(10), nullable=False)
    modelo = Column(String(50), nullable=False)
    status = Column(String(30), default="Operacional")
    garagem = Column(String(50), default="Garagem 2 - JTU")
    criado_em = Column(DateTime, default=datetime.utcnow)
