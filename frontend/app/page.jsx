"use client";

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const [abaAtiva, setAbaAtiva] = useState('operacional');
  const [searchTerm, setSearchTerm] = useState('');
  const [metricas, setMetricas] = useState(null);
  const [pareto, setPareto] = useState([]);
  const [origens, setOrigens] = useState([]);
  const [tiposManutencao, setTiposManutencao] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [reincidencia, setReincidencia] = useState([]);
  const [executivo, setExecutivo] = useState({
    mkbf: 12450.50,
    ra_sos_km: 45200.00,
    frequencia_modelos: [],
    desempenho_linhas: [],
    frota_resumo: {
      tipologia: "Ônibus Urbano Convencional",
      chassi: "Mercedes-Benz OF-1721 / OF-1722",
      carroceria: "Caio Apache Vip",
      idade_media_anos: 4.8
    }
  });
  const [loading, setLoading] = useState(true);

  const CORES_PIZZA = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];

  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const reqOptions = { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } };

    Promise.all([
      fetch(`${apiUrl}/api/dashboard/resumo`, reqOptions).then(r => r.json()).catch(() => ({})),
      fetch(`${apiUrl}/api/dashboard/pareto-veiculos`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/origem-demanda`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/tipo-manutencao`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/ranking-mecanicos`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/consumo-pecas`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/reincidencia`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/executivo`, reqOptions).then(r => r.json()).catch(() => null)
    ])
    .then(([resumoData, paretoData, origensData, tiposData, mecanicosData, pecasData, reincidenciaData, executivoData]) => {
      setMetricas(resumoData || {});
      setPareto(Array.isArray(paretoData) ? paretoData : []);
      setOrigens(Array.isArray(origensData) ? origensData.map(item => ({ name: item.origem, value: item.total })) : []);
      setTiposManutencao(Array.isArray(tiposData) ? tiposData.map(item => ({ name: item.tipo, value: item.total })) : []);
      setMecanicos(Array.isArray(mecanicosData) ? mecanicosData : []);
      setPecas(Array.isArray(pecasData) ? pecasData.map(p => ({
        ...p,
        pecaCurta: p.peca.length > 22 ? p.peca.substring(0, 20) + '...' : p.peca
      })) : []);
      setReincidencia(Array.isArray(reincidenciaData) ? reincidenciaData : []);
      if (executivoData) {
        setExecutivo(executivoData);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const formatarDinheiro = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  // Função para checar se um item ou título corresponde ao termo pesquisado
  const matchSearch = (title = '', content = '') => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const tStr = String(title).toLowerCase();
    const cStr = typeof content === 'object' ? JSON.stringify(content).toLowerCase() : String(content).toLowerCase();
    return tStr.includes(term) || cStr.includes(term);
  };

  // Listas Filtradas Dinamicamente
  const filteredPareto = pareto.filter(item => matchSearch('top 10 veículos manutenção', `${item.veiculo} ${item.total_os}`));
  const filteredOrigens = origens.filter(item => matchSearch('origem demanda', `${item.name} ${item.value}`));
  const filteredTipos = tiposManutencao.filter(item => matchSearch('tipo manutenção preventiva corretiva', `${item.name} ${item.value}`));
  const filteredMecanicos = mecanicos.filter(item => matchSearch('ranking mecânicos produtivos', `${item.mecanico} ${item.total}`));
  const filteredPecas = pecas.filter(item => matchSearch('peças custo acumulado', `${item.peca} ${item.custo}`));
  const filteredReincidencia = reincidencia.filter(item => matchSearch('veículos alta reincidência', `${item.veiculo} ${item.total_os} ${item.custo}`));

  const filteredFrequenciaModelos = executivo?.frequencia_modelos?.filter(item => matchSearch('frequência falhas modelo veículo', `${item.modelo} ${item.falhas}`)) || [];
  const filteredDesempenhoLinhas = executivo?.desempenho_linhas?.filter(item => matchSearch('desempenho linha atendida', `${item.linha} ${item.total_os} ${item.custo}`)) || [];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>ConecttaOps 🚀</h1>
            <p style={styles.subtitle}>HUB de Inovação JTU - Exercício 2026 (Garagem 2)</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={styles.filterContainer}>
              <button onClick={() => setAbaAtiva('operacional')} style={{...styles.filterBtn, backgroundColor: abaAtiva === 'operacional' ? '#38bdf8' : '#1e293b', color: abaAtiva === 'operacional' ? '#0f172a' : '#94a3b8'}}>Visão Operacional</button>
              <button onClick={() => setAbaAtiva('executiva')} style={{...styles.filterBtn, backgroundColor: abaAtiva === 'executiva' ? '#38bdf8' : '#1e293b', color: abaAtiva === 'executiva' ? '#0f172a' : '#94a3b8'}}>Visão Executiva - Sintética</button>
            </div>

            {/* Campo de Busca Geral */}
            <div style={styles.searchContainer}>
              <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>🔍</span>
              <input
                type="text"
                placeholder="Pesquisar por título, indicador, veículo, mecânico, linha, peça..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>✕</button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {loading ? (
          <div style={styles.loading}>⏳ Atualizando painel analítico de 2026...</div>
        ) : (
          <>
            {abaAtiva === 'operacional' ? (
              <>
                <div style={styles.grid4}>
                  {matchSearch('OS EXECUTADAS', metricas?.os_fechadas_periodo) && (
                    <div style={{...styles.card, borderTop: '4px solid #22c55e'}}>
                      <h2 style={styles.cardTitle}>OS EXECUTADAS</h2>
                      <p style={styles.cardValue}>{metricas?.os_fechadas_periodo ?? 0}</p>
                      <span style={styles.cardFooter}>Concluídas no ano de 2026</span>
                    </div>
                  )}

                  {matchSearch('OSs Abertas (2026)', metricas?.os_abertas_periodo) && (
                    <div style={{...styles.card, borderTop: '4px solid #3b82f6'}}>
                      <h2 style={styles.cardTitle}>OSs Abertas (2026)</h2>
                      <p style={styles.cardValue}>{metricas?.os_abertas_periodo ?? 0}</p>
                      <span style={styles.cardFooter}>Pendentes em 2026</span>
                    </div>
                  )}

                  {matchSearch('TMA Real (Horas)', metricas?.tempo_medio_atendimento_horas) && (
                    <div style={{...styles.card, borderTop: '4px solid #8b5cf6'}}>
                      <h2 style={styles.cardTitle}>TMA Real (Horas)</h2>
                      <p style={styles.cardValue}>{(metricas?.tempo_medio_atendimento_horas ?? 0).toFixed(1)}</p>
                      <span style={styles.cardFooter}>Tempo médio de execução em 2026</span>
                    </div>
                  )}

                  {matchSearch('Custo Total em OSs (2026)', metricas?.custo_total_pecas) && (
                    <div style={{...styles.card, borderTop: '4px solid #eab308'}}>
                      <h2 style={styles.cardTitle}>Custo Total em OSs (2026)</h2>
                      <p style={styles.cardValue}>{formatarDinheiro(metricas?.custo_total_pecas)}</p>
                      <div style={{ marginTop: '0.50rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span>🔧 Gastos em OSs já usadas: <strong style={{ color: '#f8fafc' }}>{formatarDinheiro(metricas?.custo_pecas_utilizado)}</strong></span>
                        <span>📦 Gastos em OSs paradas (estoque): <strong style={{ color: '#f8fafc' }}>{formatarDinheiro(metricas?.custo_pecas_estoque)}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {matchSearch('Top 10 - Veículos com Mais Manutenção', filteredPareto) && (
                    <div style={{...styles.card, minHeight: '420px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Top 10 - Veículos com Mais Manutenção (2026)</h2>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={filteredPareto} margin={{ top: 5, right: 30, left: 10, bottom: 45 }}>
                          <XAxis dataKey="veiculo" stroke="#94a3b8" angle={-30} textAnchor="end" interval={0} tick={{fontSize: 11}} />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                          <Bar dataKey="total_os" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Total de OS" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {matchSearch('Origem das Demandas', filteredOrigens) && (
                    <div style={{...styles.card, minHeight: '420px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Origem das Demandas</h2>
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie data={filteredOrigens.slice(0, 7)} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                            {filteredOrigens.slice(0, 7).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#94a3b8' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {matchSearch('Tipo de Manutenção (Preventiva vs Corretiva)', filteredTipos) && (
                    <div style={{...styles.card, minHeight: '420px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Tipo de Manutenção (Preventiva vs Corretiva)</h2>
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie data={filteredTipos} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                            {filteredTipos.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#94a3b8' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {matchSearch('Ranking - Mecânicos Mais Produtivos', filteredMecanicos) && (
                    <div style={{...styles.card, minHeight: '420px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Ranking - Mecânicos Mais Produtivos</h2>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={filteredMecanicos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <XAxis type="number" stroke="#94a3b8" />
                          <YAxis dataKey="mecanico" type="category" stroke="#94a3b8" width={140} tick={{fontSize: 12}} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                          <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} name="Atendimentos" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {matchSearch('Top Peças por Custo Acumulado (R$)', filteredPecas) && (
                    <div style={{...styles.card, minHeight: '400px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Top Peças por Custo Acumulado (R$)</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={filteredPecas} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                          <XAxis type="number" stroke="#94a3b8" />
                          <YAxis dataKey="pecaCurta" type="category" stroke="#94a3b8" width={180} tick={{fontSize: 11}} />
                          <Tooltip
                            formatter={(value) => [formatarDinheiro(value), 'Custo Total']}
                            labelFormatter={(label, items) => items?.[0]?.payload?.peca || label}
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                          />
                          <Bar dataKey="custo" fill="#ef4444" radius={[0, 4, 4, 0]} name="Custo Total (R$)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {matchSearch('Veículos com Alta Reincidência (>3 OSs)', filteredReincidencia) && (
                    <div style={{...styles.card, minHeight: '400px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>🚨 Veículos com Alta Reincidência (&gt;3 OSs)</h2>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                              <th style={{ padding: '0.8rem' }}>Prefixo</th>
                              <th style={{ padding: '0.8rem' }}>Total OSs</th>
                              <th style={{ padding: '0.8rem' }}>Custo Acumulado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredReincidencia.length > 0 ? (
                              filteredReincidencia.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                                  <td style={{ padding: '0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{item.veiculo}</td>
                                  <td style={{ padding: '0.8rem' }}>{item.total_os}</td>
                                  <td style={{ padding: '0.8rem', color: '#eab308' }}>{formatarDinheiro(item.custo)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                  Nenhum registro encontrado para a busca atual.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={styles.grid3}>
                  {matchSearch('MKBF (Quilometragem Média entre Falhas)', executivo?.mkbf) && (
                    <div style={{...styles.card, borderTop: '4px solid #38bdf8'}}>
                      <h2 style={styles.cardTitle}>MKBF (KM Médio entre Falhas)</h2>
                      <p style={styles.cardValue}>{Number(executivo?.mkbf || 12450.50).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km</p>
                      <span style={styles.cardFooter}>Confiabilidade operacional em 2026</span>
                    </div>
                  )}

                  {matchSearch('RA / SOS (KM Médio por Falha Crítica)', executivo?.ra_sos_km) && (
                    <div style={{...styles.card, borderTop: '4px solid #f59e0b'}}>
                      <h2 style={styles.cardTitle}>RA / SOS (KM Médio por Falha Crítica)</h2>
                      <p style={styles.cardValue}>{Number(executivo?.ra_sos_km || 45200.00).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km</p>
                      <span style={styles.cardFooter}>Recolhimentos e socorros em 2026</span>
                    </div>
                  )}

                  {matchSearch('Idade Média da Frota', executivo?.frota_resumo?.idade_media_anos) && (
                    <div style={{...styles.card, borderTop: '4px solid #10b981'}}>
                      <h2 style={styles.cardTitle}>Idade Média da Frota</h2>
                      <p style={styles.cardValue}>{executivo?.frota_resumo?.idade_media_anos || 4.8} anos</p>
                      <span style={styles.cardFooter}>Parque de veículos da Garagem 2</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {matchSearch('Perfil da Frota (Tipologia, Chassi & Carroceria)', executivo?.frota_resumo) && (
                    <div style={{...styles.card, minHeight: '350px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>📊 Perfil da Frota (Tipologia, Chassi & Carroceria)</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem', color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.8rem' }}>
                          <span>Tipologia Principal:</span>
                          <strong style={{ color: '#38bdf8' }}>{executivo?.frota_resumo?.tipologia || 'Convencional'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.8rem' }}>
                          <span>Chassi Predominante:</span>
                          <strong style={{ color: '#38bdf8' }}>{executivo?.frota_resumo?.chassi || 'Mercedes-Benz'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.8rem' }}>
                          <span>Carroceria Padrão:</span>
                          <strong style={{ color: '#38bdf8' }}>{executivo?.frota_resumo?.carroceria || 'Caio Apache'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {matchSearch('Frequência de Falhas por Modelo / Veículo', filteredFrequenciaModelos) && (
                    <div style={{...styles.card, minHeight: '350px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>⚠️ Frequência de Falhas por Modelo / Veículo (2026)</h2>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                              <th style={{ padding: '0.8rem' }}>Prefixo / Modelo</th>
                              <th style={{ padding: '0.8rem' }}>Total de Falhas Corretivas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredFrequenciaModelos.length > 0 ? (
                              filteredFrequenciaModelos.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                                  <td style={{ padding: '0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{item.modelo}</td>
                                  <td style={{ padding: '0.8rem', color: '#ef4444' }}>{item.falhas} falhas</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                  Nenhum dado registrado para a busca atual.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {matchSearch('Desempenho por Linha Atendida (Volume de OSs e Custo de Peças)', filteredDesempenhoLinhas) && (
                    <div style={{...styles.card, minHeight: '320px'}}>
                      <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>🚍 Desempenho por Linha Atendida (2026)</h2>
                      <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1e293b', zIndex: 1 }}>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                              <th style={{ padding: '0.8rem' }}>Linha Atendida</th>
                              <th style={{ padding: '0.8rem' }}>Total de OSs</th>
                              <th style={{ padding: '0.8rem' }}>Custo Total de Peças (R$)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDesempenhoLinhas.length > 0 ? (
                              filteredDesempenhoLinhas.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                                  <td style={{ padding: '0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{item.linha}</td>
                                  <td style={{ padding: '0.8rem' }}>{item.total_os} OSs</td>
                                  <td style={{ padding: '0.8rem', color: '#eab308' }}>{formatarDinheiro(item.custo)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                  Nenhum dado de linha encontrado para a busca atual.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui', padding: '2rem' },
  header: { marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: '#38bdf8' },
  subtitle: { fontSize: '1.1rem', color: '#94a3b8', margin: 0 },
  filterContainer: { display: 'flex', gap: '0.5rem', backgroundColor: '#1e293b', padding: '0.4rem', borderRadius: '8px', border: '1px solid #334155' },
  filterBtn: { border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease' },
  searchContainer: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1e293b', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #334155', minWidth: '340px' },
  searchInput: { backgroundColor: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.9rem', outline: 'none', width: '100%' },
  clearSearchBtn: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' },
  main: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px' },
  cardTitle: { fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: 'bold' },
  cardValue: { fontSize: '2.2rem', fontWeight: 'bold', margin: '0 0 0.3rem 0', color: '#f1f5f9' },
  cardFooter: { fontSize: '0.8rem', color: '#64748b' },
  loading: { fontSize: '1.2rem', color: '#cbd5e1', textAlign: 'center', padding: '5rem' }
};
