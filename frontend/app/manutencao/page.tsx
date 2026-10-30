'use client';

import { useEffect, useState } from 'react';

interface MetricasManutencao {
  oss_pendentes: number;
  total_oss_2026: number;
  concluidas_2026: number;
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

export default function ManutencaoPage() {
  const [metricas, setMetricas] = useState<MetricasManutencao | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [tipoFilter, setTipoFilter] = useState('TODOS');

  useEffect(() => {
    async function fetchManutencaoData() {
      setLoading(true);
      try {
        const [resMetrics, resOrdens] = await Promise.all([
          fetch('/api/v1/manutencao/metrics'),
          fetch('/api/v1/manutencao/ordens')
        ]);

        if (resMetrics.ok) {
          const dataMetrics = await resMetrics.json();
          setMetricas(dataMetrics);
        }

        if (resOrdens.ok) {
          const dataOrdens = await resOrdens.json();
          setOrdens(Array.isArray(dataOrdens) ? dataOrdens : []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de manutenção:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchManutencaoData();
  }, []);

  const ordensFiltradas = ordens.filter((o) => {
    const matchSearch =
      o.numero_os.toLowerCase().includes(search.toLowerCase()) ||
      o.veiculo_prefixo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'TODOS' || o.status_os === statusFilter;
    const matchTipo = tipoFilter === 'TODOS' || o.tipo_manutencao === tipoFilter;
    return matchSearch && matchStatus && matchTipo;
  });

  return (
    <main className="p-4 md:p-8 space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          🔧 Módulo 2: Manutenção & Ordens de Serviço
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitoramento de Intervenções de Oficina, OSs Pendentes e Histórico (2026)
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Indicador Ajustado: OSs PENDENTES */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            OSs PENDENTES
          </p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : metricas?.oss_pendentes ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-2">OSs Abertas / Em Execução (2026)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total de OSs (2026)
          </p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : metricas?.total_oss_2026 ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-2">Abertas desde 01/01/2026</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            OSs Concluídas
          </p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : metricas?.concluidas_2026 ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-2">Finalizadas em Oficina (2026)</p>
        </div>
      </div>

      {/* Tabela de OSs */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Ordens de Serviço em Acompanhamento</h2>
            <p className="text-xs text-slate-400">Registros sincronizados do Globus (>= 01/01/2026)</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Pesquisar OS ou Veículo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 w-full sm:w-56"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="Aberta">Abertas</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluida">Concluídas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Nº OS</th>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Tipo Manutenção</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data Abertura</th>
                <th className="px-4 py-3">Descrição do Serviço</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    A carregar ordens de serviço...
                  </td>
                </tr>
              ) : ordensFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhuma ordem de serviço encontrada.
                  </td>
                </tr>
              ) : (
                ordensFiltradas.map((os) => (
                  <tr key={os.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">#{os.numero_os}</td>
                    <td className="px-4 py-3 font-mono text-slate-200">{os.veiculo_prefixo}</td>
                    <td className="px-4 py-3 text-slate-300">{os.tipo_manutencao}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                          os.status_os === 'Concluida'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : os.status_os === 'Em Andamento'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {os.status_os}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-md truncate" title={os.descricao_servico}>
                      {os.descricao_servico || 'Sem descrição'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
