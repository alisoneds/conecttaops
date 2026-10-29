from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from datetime import datetime
from app.models.base import Base

class OrdemServico(Base):
    __tablename__ = "ordens_servico"

    id = Column(Integer, primary_key=True, index=True)
    numero_os = Column(String(50), unique=True, index=True, nullable=False)
    veiculo_prefixo = Column(String(20), index=True, nullable=False)
    tipo_manutencao = Column(String(50), nullable=False)  # Preventiva, Corretiva, Preditiva
    status_os = Column(String(30), nullable=False, index=True) # Aberta, Em Andamento, Concluida, Cancelada
    data_abertura = Column(DateTime, nullable=False, index=True)
    data_fechamento = Column(DateTime, nullable=True)
    descricao_servico = Column(Text, nullable=True)
    oficina = Column(String(100), default="Garagem 2 - JTU")
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
