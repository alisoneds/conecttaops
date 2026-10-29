'use client';

import { useEffect, useState, useMemo } from 'react';

interface MetricOs {
  os_em_aberto: number;
  preventivas: number;
  corretivas: number;
}

interface MetricAbast {
  total_litros: number;
  total_km_rodado: number;
  media_kml_geral: number;
  total_abastecimentos: number;
}

interface OrdemServico {
  id: number;
  numero_os: string;
  veiculo_prefixo: string;
  tipo_manutencao: string;
  status_os: string;
  data_abertura: string;
  data_fechamento?: string;
  descricao_servico?: string;
}

export default function Home() {
  const [totalFrota, setTotalFrota] = useState<number | null>(null);
  const [metricasOs, setMetricasOs] = useState<MetricOs | null>(null);
  const [metricasAbast, setMetricasAbast] = useState<MetricAbast | null>(null);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchPrefixo, setSearchPrefixo] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [filterTipo, setFilterTipo] = useState('TODOS');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [resFrota, resMetricsOs, resMetricsAbast, resOs] = await Promise.all([
          fetch('http://192.168.50.101:8000/api/frota/'),
          fetch('http://192.168.50.101:8000/api/os/metrics'),
          fetch('http://192.168.50.101:8000/api/abastecimento/metrics'),
          fetch(`http://192.168.50.101:8000/api/os/?limit=${limit}`)
        ]);
        
        const dataFrota = await resFrota.json();
        const dataMetricsOs = await resMetricsOs.json();
        const dataMetricsAbast = await resMetricsAbast.json();
        const dataOs = await resOs.json();

        setTotalFrota(Array.isArray(dataFrota) ? dataFrota.length : 0);
        setMetricasOs(dataMetricsOs);
        setMetricasAbast(dataMetricsAbast);
        setOrdensServico(Array.isArray(dataOs) ? dataOs : []);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [limit]);

  const osFiltradas = useMemo(() => {
    return ordensServico.filter((os) => {
      const matchPrefixo = os.veiculo_prefixo.toLowerCase().includes(searchPrefixo.toLowerCase()) ||
                           os.numero_os.toLowerCase().includes(searchPrefixo.toLowerCase());
      const matchStatus = filterStatus === 'TODOS' || os.status_os.toUpperCase() === filterStatus.toUpperCase();
      const matchTipo = filterTipo === 'TODOS' || os.tipo_manutencao.toUpperCase() === filterTipo.toUpperCase();
      return matchPrefixo && matchStatus && matchTipo;
    });
  }, [ordensServico, searchPrefixo, filterStatus, filterTipo]);

  const totalPreventivas = metricasOs?.preventivas || 0;
  const totalCorretivas = metricasOs?.corretivas || 0;
  const totalGeralOS = totalPreventivas + totalCorretivas || 1;
  const pctPreventiva = ((totalPreventivas / totalGeralOS) * 100).toFixed(1);
  const pctCorretiva = ((totalCorretivas / totalGeralOS) * 100).toFixed(1);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              ConecttaOps
              <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-2.5 py-1 rounded-full font-mono">
                v1.3.0
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Garagem 002 — Jacareí Transporte Urbano (JTU)
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">FUEL & MAINTENANCE ENGINE ACTIVE</span>
          </div>
        </header>

        {/* Métricas Principais (Manutenção + Combustível) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frota Validada</p>
            <p className="text-3xl font-extrabold text-white mt-2">
              {loading ? '...' : totalFrota} <span className="text-sm font-normal text-slate-500">ônibus</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">Garagem 002 JTU</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">OSs em Oficina</p>
            <p className="text-3xl font-extrabold text-white mt-2">
              {loading ? '...' : metricasOs?.os_em_aberto}
            </p>
            <p className="text-xs text-slate-500 mt-2">Serviços em andamento</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Média Geral Consumo</p>
            <p className="text-3xl font-extrabold text-white mt-2">
              {loading ? '...' : metricasAbast?.media_kml_geral} <span className="text-sm font-normal text-slate-500">Km/L</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">{metricasAbast?.total_abastecimentos.toLocaleString('pt-BR')} registros</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Volume de Combustível</p>
            <p className="text-3xl font-extrabold text-white mt-2">
              {loading ? '...' : (metricasAbast?.total_litros ? (metricasAbast.total_litros / 1000000).toFixed(2) + 'M' : '0')} <span className="text-sm font-normal text-slate-500">Litros</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">Km total: {metricasAbast?.total_km_rodado ? (metricasAbast.total_km_rodado / 1000000).toFixed(2) + 'M Km' : '0'}</p>
          </div>
        </div>

        {/* Gráfico Visual de Distribuição de Manutenção */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-white">Distribuição do Tipo de Manutenção</h2>
            <span className="text-xs text-slate-400 font-mono">Histórico DW Globus</span>
          </div>

          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${pctPreventiva}%` }} 
                className="bg-blue-500 h-full transition-all duration-500" 
                title={`Preventiva: ${pctPreventiva}%`}
              />
              <div 
                style={{ width: `${pctCorretiva}%` }} 
                className="bg-rose-500 h-full transition-all duration-500" 
                title={`Corretiva: ${pctCorretiva}%`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
                <span>Preventivas: <strong className="text-slate-200">{pctPreventiva}%</strong> ({totalPreventivas.toLocaleString('pt-BR')})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block"></span>
                <span>Corretivas: <strong className="text-slate-200">{pctCorretiva}%</strong> ({totalCorretivas.toLocaleString('pt-BR')})</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tabela de Ordens de Serviço */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Ordens de Serviço Recentes</h2>
              <p className="text-xs text-slate-400">Inspeção detalhada da frota urbana de Jacareí</p>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <input
                type="text"
                placeholder="Buscar Prefixo ou Nº OS..."
                value={searchPrefixo}
                onChange={(e) => setSearchPrefixo(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 w-full sm:w-48"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="ABERTA">Aberta</option>
                <option value="EM ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
              </select>

              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="PREVENTIVA">Preventiva</option>
                <option value="CORRETIVA">Corretiva</option>
                <option value="PREDITIVA">Preditiva</option>
              </select>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value={50}>50 Regs</option>
                <option value={100}>100 Regs</option>
                <option value={200}>200 Regs</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nº OS</th>
                  <th className="px-4 py-3">Prefixo</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Abertura</th>
                  <th className="px-4 py-3">Fechamento</th>
                  <th className="px-4 py-3">Descrição do Serviço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      Carregando dados...
                    </td>
                  </tr>
                ) : osFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  osFiltradas.map((os) => (
                    <tr key={os.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-cyan-400">#{os.numero_os}</td>
                      <td className="px-4 py-3 font-bold text-white">{os.veiculo_prefixo}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded border font-medium ${
                          os.tipo_manutencao === 'Preventiva' 
                            ? 'bg-blue-950/80 text-blue-400 border-blue-800' 
                            : os.tipo_manutencao === 'Preditiva'
                            ? 'bg-purple-950/80 text-purple-400 border-purple-800'
                            : 'bg-rose-950/80 text-rose-400 border-rose-800'
                        }`}>
                          {os.tipo_manutencao}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded font-semibold ${
                          os.status_os === 'Concluida'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : os.status_os === 'Em Andamento' || os.status_os === 'Aberta'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {os.status_os}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {os.data_fechamento ? new Date(os.data_fechamento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate" title={os.descricao_servico}>
                        {os.descricao_servico || 'Sem descrição'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}
