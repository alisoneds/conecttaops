#!/bin/bash
set -e

echo "🚀 [ConecttaOps CD] Iniciando processo de deploy auditado..."

# 1. Executar testes antes de prosseguir
echo "🧪 [QA Check] Validando suite de testes no container..."
docker compose exec -T -e PYTHONPATH=. conecttaops_backend pytest -q

# 2. Reconstruir e atualizar os containers sem parada do banco de dados
echo "📦 [Build] Atualizando imagens de producao..."
docker compose build conecttaops_backend conecttaops_frontend

echo "🔄 [Re-deploy] Reiniciando aplicacao..."
docker compose up -d --remove-orphans conecttaops_backend conecttaops_frontend

# 3. Executar migracoes pendentes do banco DW via Alembic
echo "🗄️ [Database] Aplicando migracoes Alembic..."
docker compose exec -T conecttaops_backend alembic upgrade head

# 4. Health Check dos servicos
echo "🔍 [Health Check] Verificando conectividade do Backend..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/dashboard/resumo || echo "500")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ [Deploy Concluido] ConecttaOps operando normalmente em Producao (HTTP 200)!"
else
    echo "❌ [Erro Deploy] Falha no Health Check! Status HTTP: $HTTP_STATUS"
    exit 1
fi
