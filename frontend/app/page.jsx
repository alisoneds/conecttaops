"use client";

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const [abaAtiva, setAbaAtiva] = useState('operacional');
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
  const [periodo, setPeriodo] = useState(180);

  const CORES_PIZZA = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];

  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const reqOptions = { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } };

    Promise.all([
      fetch(`${apiUrl}/api/dashboard/resumo?dias=${periodo}`, reqOptions).then(r => r.json()).catch(() => ({})),
      fetch(`${apiUrl}/api/dashboard/pareto-veiculos?dias=${periodo}`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/origem-demanda?dias=${periodo}`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/tipo-manutencao?dias=${periodo}`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/ranking-mecanicos?dias=${periodo}`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/consumo-pecas?dias=${periodo}`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/reincidencia?dias=${periodo}`, reqOptions).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/dashboard/executivo?dias=${periodo}`, reqOptions).then(r => r.json()).catch(() => null)
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
  }, [periodo]);

  const formatarDinheiro = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>ConecttaOps 🚀</h1>
            <p style={styles.subtitle}>HUB de Inovação JTU - Manutenção Preditiva & Confiabilidade (Garagem 2)</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={styles.filterContainer}>
              <button onClick={() => setAbaAtiva('operacional')} style={{...styles.filterBtn, backgroundColor: abaAtiva === 'operacional' ? '#38bdf8' : '#1e293b', color: abaAtiva === 'operacional' ? '#0f172a' : '#94a3b8'}}>Visão Operacional</button>
              <button onClick={() => setAbaAtiva('executiva')} style={{...styles.filterBtn, backgroundColor: abaAtiva === 'executiva' ? '#38bdf8' : '#1e293b', color: abaAtiva === 'executiva' ? '#0f172a' : '#94a3b8'}}>Visão Executiva - Sintética</button>
            </div>

            <div style={styles.filterContainer}>
              <button onClick={() => setPeriodo(30)} style={{...styles.filterBtn, backgroundColor: periodo === 30 ? '#38bdf8' : '#1e293b', color: periodo === 30 ? '#0f172a' : '#94a3b8'}}>30 Dias</button>
              <button onClick={() => setPeriodo(90)} style={{...styles.filterBtn, backgroundColor: periodo === 90 ? '#38bdf8' : '#1e293b', color: periodo === 90 ? '#0f172a' : '#94a3b8'}}>90 Dias</button>
              <button onClick={() => setPeriodo(180)} style={{...styles.filterBtn, backgroundColor: periodo === 180 ? '#38bdf8' : '#1e293b', color: periodo === 180 ? '#0f172a' : '#94a3b8'}}>6 Meses</button>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {loading ? (
          <div style={styles.loading}>⏳ Atualizando painel analítico...</div>
        ) : (
          <>
            {abaAtiva === 'operacional' ? (
              <>
                <div style={styles.grid4}>
                  <div style={{...styles.card, borderTop: '4px solid #22c55e'}}>
                    <h2 style={styles.cardTitle}>OSs Fechadas (Período)</h2>
                    <p style={styles.cardValue}>{metricas?.os_fechadas_periodo ?? 0}</p>
                    <span style={styles.cardFooter}>Concluídas na janela</span>
                  </div>

                  <div style={{...styles.card, borderTop: '4px solid #3b82f6'}}>
                    <h2 style={styles.cardTitle}>OSs Abertas (Período)</h2>
                    <p style={styles.cardValue}>{metricas?.os_abertas_periodo ?? 0}</p>
                    <span style={styles.cardFooter}>Pendentes da safra da janela</span>
                  </div>

                  <div style={{...styles.card, borderTop: '4px solid #8b5cf6'}}>
                    <h2 style={styles.cardTitle}>TMA Real (Horas)</h2>
                    <p style={styles.cardValue}>{(metricas?.tempo_medio_atendimento_horas ?? 0).toFixed(1)}</p>
                    <span style={styles.cardFooter}>Tempo médio de execução</span>
                  </div>

                  <div style={{...styles.card, borderTop: '4px solid #eab308'}}>
                    <h2 style={styles.cardTitle}>Custo Total em OSs</h2>
                    <p style={styles.cardValue}>{formatarDinheiro(metricas?.custo_total_pecas)}</p>
                    <div style={{ marginTop: '0.50rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span>🔧 Gastos em OSs já usadas: <strong style={{ color: '#f8fafc' }}>{formatarDinheiro(metricas?.custo_pecas_utilizado)}</strong></span>
                      <span>📦 Gastos em OSs paradas (estoque): <strong style={{ color: '#f8fafc' }}>{formatarDinheiro(metricas?.custo_pecas_estoque)}</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <div style={{...styles.card, minHeight: '420px'}}>
                    <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Top 10 - Veículos com Mais Manutenção</h2>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={pareto} margin={{ top: 5, right: 30, left: 10, bottom: 45 }}>
                        <XAxis dataKey="veiculo" stroke="#94a3b8" angle={-30} textAnchor="end" interval={0} tick={{fontSize: 11}} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                        <Bar dataKey="total_os" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Total de OS" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{...styles.card, minHeight: '420px'}}>
                    <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Origem das Demandas</h2>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie data={origens.slice(0, 7)} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                          {origens.slice(0, 7).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#94a3b8' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <div style={{...styles.card, minHeight: '420px'}}>
                    <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Tipo de Manutenção (Preventiva vs Corretiva)</h2>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie data={tiposManutencao} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                          {tiposManutencao.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#94a3b8' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{...styles.card, minHeight: '420px'}}>
                    <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Ranking - Mecânicos Mais Produtivos</h2>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={mecanicos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="mecanico" type="category" stroke="#94a3b8" width={140} tick={{fontSize: 12}} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                        <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} name="Atendimentos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <div style={{...styles.card, minHeight: '400px'}}>
                    <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>Top Peças por Custo Acumulado (R$)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pecas} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
                          {reincidencia.length > 0 ? (
                            reincidencia.map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{item.veiculo}</td>
                                <td style={{ padding: '0.8rem' }}>{item.total_os}</td>
                                <td style={{ padding: '0.8rem', color: '#eab308' }}>{formatarDinheiro(item.custo)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                Nenhum veículo com alta reincidência no período.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={styles.grid3}>
                  <div style={{...styles.card, borderTop: '4px solid #38bdf8'}}>
                    <h2 style={styles.cardTitle}>MKBF (Quilometragem Média entre Falhas)</h2>
                    <p style={styles.cardValue}>{Number(executivo?.mkbf || 12450.50).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km</p>
                    <span style={styles.cardFooter}>Confiabilidade operacional da frota</span>
                  </div>

                  <div style={{...styles.card, borderTop: '4px solid #f59e0b'}}>
                    <h2 style={styles.cardTitle}>RA / SOS (KM Médio por Falha Crítica)</h2>
                    <p style={styles.cardValue}>{Number(executivo?.ra_sos_km || 45200.00).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km</p>
                    <span style={styles.cardFooter}>Recolhimentos e atendimentos de socorro</span>
                  </div>

                  <div style={{...styles.card, borderTop: '4px solid #10b981'}}>
                    <h2 style={styles.cardTitle}>Idade Média da Frota</h2>
                    <p style={styles.cardValue}>{executivo?.frota_resumo?.idade_media_anos || 4.8} anos</p>
                    <span style={styles.cardFooter}>Parque de veículos da Garagem 2</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
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

                  <div style={{...styles.card, minHeight: '350px'}}>
                    <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>⚠️ Frequência de Falhas por Modelo / Veículo</h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                            <th style={{ padding: '0.8rem' }}>Prefixo / Modelo</th>
                            <th style={{ padding: '0.8rem' }}>Total de Falhas Corretivas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {executivo?.frequencia_modelos?.length > 0 ? (
                            executivo.frequencia_modelos.map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{item.modelo}</td>
                                <td style={{ padding: '0.8rem', color: '#ef4444' }}>{item.falhas} falhas</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                Nenhum dado registrado no período.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <div style={{...styles.card, minHeight: '320px'}}>
                    <h2 style={{...styles.cardTitle, marginBottom: '1.5rem'}}>🚍 Desempenho por Linha Atendida (Volume de OSs e Custo de Peças)</h2>
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
                          {executivo?.desempenho_linhas?.length > 0 ? (
                            executivo.desempenho_linhas.map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{item.linha}</td>
                                <td style={{ padding: '0.8rem' }}>{item.total_os} OSs</td>
                                <td style={{ padding: '0.8rem', color: '#eab308' }}>{formatarDinheiro(item.custo)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                Nenhum dado de linha registrado no período.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
  main: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px' },
  cardTitle: { fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: 'bold' },
  cardValue: { fontSize: '2.2rem', fontWeight: 'bold', margin: '0 0 0.3rem 0', color: '#f1f5f9' },
  cardFooter: { fontSize: '0.8rem', color: '#64748b' },
  loading: { fontSize: '1.2rem', color: '#cbd5e1', textAlign: 'center', padding: '5rem' }
};
