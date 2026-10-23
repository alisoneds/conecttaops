#!/bin/bash
set -e

echo "🚀 [ConecttaOps CD] Iniciando processo de deploy auditado..."

# 1. Executar testes antes de prosseguir
echo "🧪 [QA Check] Validando suíte de testes no container..."
docker compose exec -T -e PYTHONPATH=. conecttaops_backend pytest -q

# 2. Reconstruir e atualizar os containers
echo "📦 [Build] Atualizando imagens de produção..."
docker compose build conecttaops_backend conecttaops_frontend

echo "🔄 [Re-deploy] Reiniciando aplicação..."
docker compose up -d --remove-orphans conecttaops_backend conecttaops_frontend

# 3. Executar migrações do banco DW via Alembic
echo "🗄️ [Database] Aplicando migrações Alembic..."
docker compose exec -T conecttaops_backend alembic upgrade head

# 4. Health Check via Readiness Probe (/health/ready)
echo "🔍 [Observabilidade] Verificando Liveness & Readiness Probes..."
MAX_TRIES=5
COUNT=0
HTTP_STATUS="000"

while [ $COUNT -lt $MAX_TRIES ]; do
    sleep 3
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health/ready || echo "000")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        break
    fi
    COUNT=$((COUNT+1))
    echo "⏳ Aguardando backend prontidão (tentativa $COUNT/$MAX_TRIES - Status: $HTTP_STATUS)..."
done

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ [Observabilidade OK] ConecttaOps operando normalmente e auditado em Produção (HTTP 200)!"
else
    echo "❌ [Erro Deploy] Falha no Health Check após $MAX_TRIES tentativas! Status HTTP: $HTTP_STATUS"
    exit 1
fi
