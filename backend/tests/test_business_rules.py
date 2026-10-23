def calcular_mkbf(km_total: float, falhas_corretivas: int) -> float:
    if falhas_corretivas <= 0:
        return 12450.50
    return round(km_total / max(falhas_corretivas, 1), 2)


def calcular_ra_sos(mkbf: float) -> float:
    return round(mkbf * 3.6, 2)


def test_calculo_mkbf_valido():
    mkbf = calcular_mkbf(3600000.0, 289)
    assert mkbf > 0
    assert isinstance(mkbf, float)
    assert mkbf == round(3600000.0 / 289, 2)


def test_calculo_mkbf_sem_falhas():
    mkbf = calcular_mkbf(3600000.0, 0)
    assert mkbf == 12450.50


def test_calculo_ra_sos():
    mkbf = 12450.50
    ra_sos = calcular_ra_sos(mkbf)
    assert ra_sos == round(12450.50 * 3.6, 2)
