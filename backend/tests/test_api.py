from unittest.mock import patch
from fastapi.testclient import TestClient

try:
    import app.main as main_module
except ImportError:
    import main as main_module

client = TestClient(main_module.app)


def test_health_liveness():
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"


def test_health_readiness():
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data


def test_audit_request_id_header():
    response = client.get("/api/dashboard/resumo")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time-MS" in response.headers


def test_todos_endpoints_operacionais():
    endpoints = [
        "/api/dashboard/resumo",
        "/api/dashboard/pareto-veiculos",
        "/api/dashboard/origem-demanda",
        "/api/dashboard/tipo-manutencao",
        "/api/dashboard/ranking-mecanicos",
        "/api/dashboard/consumo-pecas",
        "/api/dashboard/reincidencia",
        "/api/dashboard/executivo"
    ]
    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 200


def test_ordenacao_crescente_linhas():
    response = client.get("/api/dashboard/executivo?dias=180")
    data = response.json()
    linhas = [item["linha"] for item in data.get("desempenho_linhas", [])]
    if len(linhas) > 1:
        assert linhas == sorted(linhas), "Erro: Linhas não estão em ordem crescente."


def test_tratamento_excecoes_resiliencia_db():
    target = f"{main_module.__name__}.pg_engine.connect"
    with patch(target, side_effect=Exception("Simulação de Falha no DW")):
        assert client.get("/api/dashboard/resumo").json()["total_os_periodo"] == 0
        assert client.get("/api/dashboard/pareto-veiculos").json() == []
        assert client.get("/api/dashboard/origem-demanda").json() == []
        assert client.get("/api/dashboard/tipo-manutencao").json() == []
        assert client.get("/api/dashboard/ranking-mecanicos").json() == []
        assert client.get("/api/dashboard/consumo-pecas").json() == []
        assert client.get("/api/dashboard/reincidencia").json() == []
        assert client.get("/api/dashboard/executivo").json()["mkbf"] == 12450.50
        assert client.get("/health/ready").json()["status"] == "NOT_READY"
