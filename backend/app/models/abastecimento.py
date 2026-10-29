from sqlalchemy import Column, String, Integer, DateTime, Float
from datetime import datetime
from app.models.base import Base

class Abastecimento(Base):
    __tablename__ = "abastecimentos"

    id = Column(Integer, primary_key=True, index=True)
    chave_abastecimento = Column(String(100), unique=True, index=True, nullable=False)
    veiculo_prefixo = Column(String(20), index=True, nullable=False)
    data_abastecimento = Column(DateTime, nullable=False, index=True)
    litros = Column(Float, nullable=False)
    km_odometro = Column(Float, default=0.0)
    km_rodado = Column(Float, default=0.0)
    km_por_litro = Column(Float, default=0.0)
    bomba = Column(Integer, nullable=True)
    tanque = Column(Integer, nullable=True)
    tipo_combustivel = Column(String(50), default="Diesel S10")
    criado_em = Column(DateTime, default=datetime.utcnow)
