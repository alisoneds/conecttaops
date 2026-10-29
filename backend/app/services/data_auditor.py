import logging
from datetime import datetime

logger = logging.getLogger("conecttaops.auditor")

class DataAuditor:
    @staticmethod
    def auditar_frota(veiculos_raw: list) -> tuple[bool, list, dict]:
        anomalias = []
        veiculos_aprovados = []
        tipos_proibidos_detectados = []

        for index, item in enumerate(veiculos_raw):
            prefixo = str(item.get("prefixo", "")).strip()
            placa = str(item.get("placa", "")).strip()
            tipo_frota = item.get("tipo_frota")
            empresa = item.get("empresa")
            garagem = item.get("garagem")

            if tipo_frota in [12, 13]:
                tipos_proibidos_detectados.append(prefixo)
                continue

            if not prefixo:
                anomalias.append(f"Linha {index}: Veículo sem Prefixo.")
                continue

            if empresa != 2 or garagem != 2:
                anomalias.append(f"Veículo {prefixo} pertence à Empresa/Garagem {empresa}/{garagem} e não à 002/002.")
                continue

            veiculos_aprovados.append({
                "prefixo": prefixo,
                "placa": placa or "S/PLACA",
                "status": "Operacional"
            })

        if tipos_proibidos_detectados:
            anomalias.append(f"CRÍTICO: {len(tipos_proibidos_detectados)} veículos dos tipos 012/013 detectados.")

        aprovado = len(anomalias) == 0 and len(veiculos_aprovados) > 0
        relatorio = {
            "total_lidos": len(veiculos_raw),
            "aprovados": len(veiculos_aprovados),
            "rejeitados": len(veiculos_raw) - len(veiculos_aprovados),
            "erros": anomalias
        }
        return aprovado, veiculos_aprovados, relatorio

    @staticmethod
    def auditar_ordens_servico(os_raw: list, prefixos_validos_jtu: set) -> tuple[bool, list, dict]:
        anomalias = []
        os_aprovadas = []

        for index, item in enumerate(os_raw):
            num_os = str(item.get("numero_os", "")).strip()
            prefixo = str(item.get("veiculo_prefixo", "")).strip()
            tipo = str(item.get("tipo_manutencao", "Corretiva")).strip()
            status = str(item.get("status_os", "Aberta")).strip()
            data_abertura = item.get("data_abertura")

            if not num_os:
                continue

            if prefixo not in prefixos_validos_jtu:
                continue

            # Garante que data_abertura não seja nula para satisfazer o schema do banco
            if not data_abertura:
                data_abertura = datetime.utcnow()

            os_aprovadas.append({
                "numero_os": num_os,
                "veiculo_prefixo": prefixo,
                "tipo_manutencao": tipo if tipo in ["Preventiva", "Corretiva", "Preditiva"] else "Corretiva",
                "status_os": status if status in ["Aberta", "Em Andamento", "Concluida", "Cancelada"] else "Aberta",
                "data_abertura": data_abertura,
                "data_fechamento": item.get("data_fechamento"),
                "descricao_servico": str(item.get("descricao_servico") or "Serviço de Manutenção")[:500]
            })

        aprovado = True
        relatorio = {
            "total_lidos": len(os_raw),
            "aprovados": len(os_aprovadas),
            "rejeitados": len(os_raw) - len(os_aprovadas),
            "erros": anomalias
        }
        return aprovado, os_aprovadas, relatorio
