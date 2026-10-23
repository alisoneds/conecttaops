#!/bin/bash
set -euo pipefail

# 1. Carregar variáveis do .env se existir
if [ -f /root/opt/conecttaops/.env ]; then
    set -a
    source /root/opt/conecttaops/.env
    set +a
fi

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-conecttaops_dw}"
BACKUP_DIR="/root/opt/conecttaops/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/conecttaops_dw_${TIMESTAMP}.sql.gz"

echo "💾 [Backup DW] Iniciando dump comprimido (Usuário: ${DB_USER}, Banco: ${DB_NAME})..."

# 2. Executar o pg_dump garantindo a passagem do usuário e banco corretos
docker compose -f /root/opt/conecttaops/docker-compose.yml exec -T conecttaops_postgres pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" | gzip > "$BACKUP_FILE"

echo "✅ [Backup Concluído] Arquivo salvo com sucesso em: ${BACKUP_FILE}"

# 3. Rotatividade: Remover backups com mais de 7 dias
find "$BACKUP_DIR" -name "conecttaops_dw_*.sql.gz" -mtime +7 -exec rm -f {} \;
echo "🧹 [Rotatividade] Manutenção de retenção concluída."
