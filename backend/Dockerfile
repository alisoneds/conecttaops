FROM python:3.11-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependências nativas do sistema
RUN apt-get update && \
    apt-get install -y --no-install-recommends libaio1 wget unzip && \
    rm -rf /var/lib/apt/lists/*

# Baixar e configurar o Oracle Instant Client 19c (Thick Mode)
RUN mkdir -p /opt/oracle && \
    cd /opt/oracle && \
    wget https://download.oracle.com/otn_software/linux/instantclient/1923000/instantclient-basiclite-linux.x64-19.23.0.0.0dbru.zip && \
    unzip instantclient-basiclite-linux.x64-19.23.0.0.0dbru.zip && \
    rm instantclient-basiclite-linux.x64-19.23.0.0.0dbru.zip && \
    echo /opt/oracle/instantclient_19_23 > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_19_23:$LD_LIBRARY_PATH

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
