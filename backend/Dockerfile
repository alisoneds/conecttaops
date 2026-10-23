# Fixando no Debian 12 (Bookworm) para garantir estabilidade do pacote libaio1
FROM python:3.11-slim-bookworm

# Instalar dependências do sistema operacional necessárias para o Oracle Client
RUN apt-get update && apt-get install -y \
    libaio1 \
    unzip \
    wget \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Baixar e configurar o Oracle Instant Client 19c (Thick Mode)
WORKDIR /opt/oracle
RUN wget https://download.oracle.com/otn_software/linux/instantclient/1921000/instantclient-basic-linux.x64-19.21.0.0.0dbru.zip \
    && unzip instantclient-basic-linux.x64-19.21.0.0.0dbru.zip \
    && rm instantclient-basic-linux.x64-19.21.0.0.0dbru.zip \
    && sh -c "echo /opt/oracle/instantclient_19_21 > /etc/ld.so.conf.d/oracle-instantclient.conf" \
    && ldconfig

# Variável de ambiente obrigatória para que a lib oracledb encontre os binários
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_19_21:$LD_LIBRARY_PATH

# Configurar aplicação Python
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Comando default de inicialização da API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
