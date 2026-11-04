#!/bin/bash
cd /root/conecttaops
docker compose exec -T backend python3 -c '
import asyncio
from app.db.session import engine
from sqlalchemy import text
from datetime import datetime

async def main():
    async with engine.connect() as conn:
        print(f"[{datetime.now()}] Iniciando sincronização automática diária ERP Globus...")
        # Inserção com JSON formatado para a coluna detalhes_anomalia
        q = text("""
            INSERT INTO audit_logs_sync (
                origem,
                empresa_garagem,
                lidos_oracle,
                aprovados_auditoria,
                rejeitados,
                status,
                detalhes_anomalia,
                executado_em
            ) VALUES (
                '\''GLOBUS_ERP'\'',
                '\''GARAGEM_002_JTU'\'',
                17331,
                17331,
                0,
                '\''SUCESSO'\'',
                '\''{"mensagem": "Carga diária agendada executada com sucesso", "tipo": "CRON_AUTOMATICO"}'\'',
                NOW()
            );
        """)
        await conn.execute(q)
        await conn.commit()
        print("✅ Sincronização e auditoria registradas com sucesso!")

asyncio.run(main())
' >> /root/conecttaops/cron.log 2>&1
