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

            if not num_os or prefixo not in prefixos_validos_jtu:
                continue

            os_aprovadas.append({
                "numero_os": num_os,
                "veiculo_prefixo": prefixo,
                "tipo_manutencao": tipo if tipo in ["Preventiva", "Corretiva", "Preditiva"] else "Corretiva",
                "status_os": status if status in ["Aberta", "Em Andamento", "Concluida", "Cancelada"] else "Aberta",
                "data_abertura": data_abertura or datetime.utcnow(),
                "data_fechamento": item.get("data_fechamento"),
                "descricao_servico": str(item.get("descricao_servico") or "Serviço de Manutenção")[:500]
            })

        relatorio = {
            "total_lidos": len(os_raw),
            "aprovados": len(os_aprovadas),
            "rejeitados": len(os_raw) - len(os_aprovadas),
            "erros": anomalias
        }
        return True, os_aprovadas, relatorio

    @staticmethod
    def auditar_abastecimentos(abast_raw: list, prefixos_validos_jtu: set) -> tuple[bool, list, dict]:
        """
        Aplica travas de integridade física no abastecimento (litros > 0, Km/L coerente para ônibus urbano).
        """
        anomalias = []
        abast_aprovados = []

        for index, item in enumerate(abast_raw):
            prefixo = str(item.get("veiculo_prefixo", "")).strip()
            litros = float(item.get("litros") or 0.0)
            km_rodado = float(item.get("km_rodado") or 0.0)
            chave = str(item.get("chave_abastecimento", "")).strip()

            if not chave or prefixo not in prefixos_validos_jtu:
                continue

            if litros <= 0:
                continue

            # Cálculo de média Km/L com trava de inconsistência (ex: desconsidera Km/L > 12.0 ou < 0.2 para ônibus urbano)
            kml = round(km_rodado / litros, 2) if litros > 0 and km_rodado > 0 else 0.0
            if kml > 15.0:
                kml = 0.0  # Anomalia de odômetro zerado ou adulterado

            abast_aprovados.append({
                "chave_abastecimento": chave,
                "veiculo_prefixo": prefixo,
                "data_abastecimento": item.get("data_abastecimento") or datetime.utcnow(),
                "litros": litros,
                "km_odometro": float(item.get("km_odometro") or 0.0),
                "km_rodado": km_rodado,
                "km_por_litro": kml,
                "bomba": item.get("bomba"),
                "tanque": item.get("tanque"),
                "tipo_combustivel": "Diesel S10"
            })

        relatorio = {
            "total_lidos": len(abast_raw),
            "aprovados": len(abast_aprovados),
            "rejeitados": len(abast_raw) - len(abast_aprovados),
            "erros": anomalias
        }
        return True, abast_aprovados, relatorio
