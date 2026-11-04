import logging
from datetime import datetime, timedelta
from sqlalchemy import text
from app.db.session import engine
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Tabela de Severidade Operacional por Sistema
PESOS_SISTEMAS = {
    "MOTOR": 3.0,
    "FREIO": 2.8,
    "TRANSMISSAO": 2.5,
    "EMBREAGEM": 2.2,
    "SUSPENSAO": 2.0,
    "DIRECAO": 2.0,
    "ELETRICA": 1.5,
    "AR CONDICIONADO": 1.0,
    "REFRIGERACAO": 1.0,
    "ESCAPAMENTO": 1.0,
    "PNEU": 0.8,
    "FUNILARIA": 0.4,
    "PINTURA": 0.3,
    "TAPEÇARIA": 0.3,
    "LIMPEZA": 0.1
}

def calcular_peso_descricao(descricao: str) -> float:
    if not descricao:
        return 0.5
    desc_upper = descricao.upper()
    peso_max = 0.5
    for termo, peso in PESOS_SISTEMAS.items():
        if termo in desc_upper:
            if peso > peso_max:
                peso_max = peso
    return peso_max

async def executar_predicao_manutencao():
    async with AsyncSession(engine) as session:
        try:
            # Limpa registros antigos
            await session.execute(text("DELETE FROM predicoes_manutencao;"))

            # Busca o histórico completo de OSs por veículo
            query_os = text("""
                SELECT 
                    veiculo_prefixo,
                    numero_os,
                    data_abertura,
                    COALESCE(descricao_servico, '') as desc_servico,
                    COALESCE(tipo_manutencao, '') as tipo
                FROM ordens_servico
                WHERE veiculo_prefixo IS NOT NULL AND veiculo_prefixo != ''
                ORDER BY veiculo_prefixo, data_abertura ASC;
            """)

            result = await session.execute(query_os)
            rows = result.fetchall()

            frota_historico = {}
            for row in rows:
                prefixo = row[0]
                if prefixo not in frota_historico:
                    frota_historico[prefixo] = []
                frota_historico[prefixo].append({
                    "numero_os": str(row[1]),
                    "data_abertura": row[2],
                    "descricao": row[3],
                    "tipo": row[4]
                })

            # Data de referência baseada na última carga de OSs
            datas_validas = [item["data_abertura"] for lista in frota_historico.values() for item in lista if item["data_abertura"]]
            data_max_base = max(datas_validas) if datas_validas else datetime.utcnow()

            for prefixo, lista_os in frota_historico.items():
                total_os = len(lista_os)
                ultima_os_item = lista_os[-1]
                ultima_os_num = ultima_os_item["numero_os"] or "196000"
                ultima_data = ultima_os_item["data_abertura"]

                # 1. Cálculo de MTBF (Intervalo Médio em Dias)
                intervalos = []
                pesos_lista = []
                for i in range(len(lista_os)):
                    peso = calcular_peso_descricao(lista_os[i]["descricao"])
                    pesos_lista.append(peso)

                    if i > 0 and lista_os[i]["data_abertura"] and lista_os[i-1]["data_abertura"]:
                        diff = (lista_os[i]["data_abertura"] - lista_os[i-1]["data_abertura"]).days
                        if diff > 0:
                            intervalos.append(diff)

                mtbf_dias = (sum(intervalos) / len(intervalos)) if intervalos else 20.0
                mtbf_dias = round(max(mtbf_dias, 8.0), 1)

                # 2. Recência e Severidade Recente (Últimas 3 OSs)
                dias_desde_ultima = (data_max_base - ultima_data).days if ultima_data else 0
                dias_desde_ultima = max(dias_desde_ultima, 0)
                proporcao_mtbf = dias_desde_ultima / mtbf_dias if mtbf_dias > 0 else 0.5

                pesos_recentes = pesos_lista[-3:] if len(pesos_lista) >= 3 else pesos_lista
                severidade_recente = sum(pesos_recentes) / len(pesos_recentes)

                # 3. Composição da Pontuação Preditiva (0 a 100)
                score_tempo = min(proporcao_mtbf * 25.0, 40.0)
                score_severidade = (severidade_recente / 3.0) * 45.0
                
                os_recentes_60d = sum(1 for item in lista_os if item["data_abertura"] and (data_max_base - item["data_abertura"]).days <= 60)
                score_reincidencia = min(os_recentes_60d * 3.0, 15.0)

                probabilidade = min(max(round(score_tempo + score_severidade + score_reincidencia, 1), 8.0), 96.0)

                # 4. Regra de Classificação de Risco
                if probabilidade >= 78.0 and severidade_recente >= 2.0:
                    nivel_risco = "Crítico"
                elif probabilidade >= 48.0 or severidade_recente >= 1.8:
                    nivel_risco = "Moderado"
                else:
                    nivel_risco = "Baixo"

                data_proxima_prevista = (ultima_data + timedelta(days=int(mtbf_dias))).strftime("%d/%m/%Y") if ultima_data else "N/D"

                if nivel_risco == "Crítico":
                    recomendacao = f"Inspecionar sistema crítico (Severidade: {round(severidade_recente,1)}). MTBF ({mtbf_dias}d) excedido."
                elif nivel_risco == "Moderado":
                    recomendacao = f"Atenção: Próxima preventiva prevista para {data_proxima_prevista} (MTBF: {mtbf_dias}d)."
                else:
                    recomendacao = f"Operação normal. Próxima preventiva programada para {data_proxima_prevista}."

                insert_query = text("""
                    INSERT INTO predicoes_manutencao
                    (veiculo_prefixo, nivel_risco, media_intervalo_dias, ultima_os, data_ultima_intervencao, probabilidade_falha, recomendacao)
                    VALUES (:prefixo, :risco, :intervalo, :ultima_os, :data_intervencao, :prob, :rec);
                """)

                await session.execute(insert_query, {
                    "prefixo": prefixo,
                    "risco": nivel_risco,
                    "intervalo": mtbf_dias,
                    "ultima_os": ultima_os_num,
                    "data_intervencao": ultima_data,
                    "prob": probabilidade,
                    "rec": recomendacao
                })

            await session.commit()
            logger.info("--> Engine Preditiva calibrada e recalculada com sucesso.")
        except Exception as e:
            await session.rollback()
            logger.error(f"Erro no motor preditivo: {e}")
            raise e
