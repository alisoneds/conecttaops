import logging

logger = logging.getLogger("conecttaops.auditor")

class DataAuditor:
    @staticmethod
    def auditar_frota(veiculos_raw: list) -> tuple[bool, list, dict]:
        """
        Executa validações rigorosas nos dados brutos vindos do Globus.
        Retorna: (aprovado: bool, dados_limpos: list, relatorio_anomalias: dict)
        """
        anomalias = []
        veiculos_aprovados = []
        tipos_proibidos_detectados = []

        for index, item in enumerate(veiculos_raw):
            prefixo = str(item.get("prefixo", "")).strip()
            placa = str(item.get("placa", "")).strip()
            tipo_frota = item.get("tipo_frota")
            empresa = item.get("empresa")
            garagem = item.get("garagem")

            # Validação 1: Tipos Proibidos (12 e 13)
            if tipo_frota in [12, 13]:
                tipos_proibidos_detectados.append(prefixo)
                continue

            # Validação 2: Campos Obrigatórios
            if not prefixo:
                anomalias.append(f"Linha {index}: Veículo sem Prefixo.")
                continue

            # Validação 3: Empresa e Garagem incorretas
            if empresa != 2 or garagem != 2:
                anomalias.append(f"Veículo {prefixo} pertence à Empresa/Garagem {empresa}/{garagem} e não à 002/002.")
                continue

            veiculos_aprovados.append({
                "prefixo": prefixo,
                "placa": placa or "S/PLACA",
                "status": "Operacional"
            })

        # Trava de Segurança: Abortar se houver tipos proibidos vazando na query
        if tipos_proibidos_detectados:
            anomalias.append(f"CRÍTICO: {len(tipos_proibidos_detectados)} veículos dos tipos 012/013 tentaram burlar o filtro. Ex: {tipos_proibidos_detectados[:3]}")

        aprovado = len(anomalias) == 0 and len(veiculos_aprovados) > 0
        
        relatorio = {
            "total_lidos": len(veiculos_raw),
            "aprovados": len(veiculos_aprovados),
            "rejeitados": len(veiculos_raw) - len(veiculos_aprovados),
            "erros": anomalias
        }

        return aprovado, veiculos_aprovados, relatorio
