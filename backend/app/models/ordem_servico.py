from sqlalchemy import Column, Integer, String, DateTime
from app.models.base import Base

class OrdemServico(Base):
    __tablename__ = "ordens_servico"

    id = Column(Integer, primary_key=True, index=True)
    numero_os = Column(String, unique=True, index=True, nullable=False)
    veiculo_prefixo = Column(String, index=True, nullable=False)
    tipo_manutencao = Column(String, nullable=False)
    status_os = Column(String, nullable=False)
    data_abertura = Column(DateTime, nullable=False)
    data_fechamento = Column(DateTime, nullable=True)
    descricao_servico = Column(String, nullable=True)
