from sqlalchemy import Column, Integer, String, DateTime
from app.models.base import Base

class Veiculo(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True)
    prefixo = Column(String, unique=True, index=True, nullable=False)
    placa = Column(String, nullable=True)
    modelo_chassis = Column(String, nullable=True)
    modelo_carroceria = Column(String, nullable=True)
    ano_fabricacao = Column(Integer, nullable=True)
    data_inicio_uso = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="Ativo")
    garagem = Column(String, nullable=True)
