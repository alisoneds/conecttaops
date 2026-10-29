#!/bin/bash
echo "🚀 Iniciando Deploy em Produção (ConecttaOps)..."
git pull origin main
docker compose up -d --build
echo "✅ Deploy finalizado com sucesso!"
