'use client';

import { useEffect, useState, useCallback } from 'react';

interface MetricasManutencao {
  oss_pendentes: number;
  total_oss: number;
  oss_concluidas: number;
}

interface OSItem {
  id: number;
  numero_os: string;
  veiculo_prefixo: string;
  data_abertura: string;
  status: string;
  tipo_manutencao: string;
  descricao_servico: string;
}

export default function ManutencaoPage() {
  const [metricas, setMetricas] = useState<MetricasManutencao | null>(null);
  const [loading, setLoading] = useState(true);

  // Paginação
  const [registros, setRegistros] = useState<OSItem[]>([]);
  const [searchPrefixo, setSearchPrefixo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingTable, setLoadingTable] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/manutencao/metrics');
        if (res.ok) {
          const data = await res.json();
          setMetricas(data);
        }
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const fetchOSs = useCallback(async (p: number, pref: string) => {
    setLoadingTable(true);
    try {
      const url = `/api/v1/manutencao?page=${p}&page_size=${pageSize}&prefixo=${encodeURIComponent(pref)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRegistros(Array.isArray(data.items) ? data.items : []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error('Erro ao carregar OSs paginadas:', err);
    } finally {
      setLoadingTable(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchOSs(page, searchPrefixo);
  }, [page, searchPrefixo, fetchOSs]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPrefixo(e.target.value);
    setPage(1);
  };

  return (
    <main className="p-4 md:p-8 space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          🛠️ Módulo MAN: Manutenção & Ordens de Serviço
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitoramento e Execução de Oficina da Garagem 002 — JTU
        </p>
      </header>

      {/* KPIs Corrigidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* OSs Pendentes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">OSs PENDENTES</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-mono tracking-tight">
            {loading ? '...' : (metricas?.oss_pendentes ?? 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-slate-500 mt-2">OSs Abertas / Em Execução (2026)</p>
        </div>

        {/* Total de OSs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TOTAL DE OSs (2026)</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-mono tracking-tight">
            {loading ? '...' : (metricas?.total_oss ?? 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-slate-500 mt-2">Abertas desde 01/01/2026</p>
        </div>

        {/* OSs Concluídas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">OSs CONCLUÍDAS</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-mono tracking-tight">
            {loading ? '...' : (metricas?.oss_concluidas ?? 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-slate-500 mt-2">Finalizadas em Oficina (2026)</p>
        </div>

      </div>

      {/* Tabela Geral de Ordens de Serviço (Paginada) */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Histórico Geral de Intervenções</h2>
            <p className="text-xs text-slate-400">Listagem de todas as OSs desde 01/01/2026</p>
          </div>
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filtrar por Prefixo..."
              value={searchPrefixo}
              onChange={handleSearchChange}
              className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 w-full sm:w-64 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-[11px] font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Data Abertura</th>
                <th className="px-4 py-3">Nº OS</th>
                <th className="px-4 py-3">Prefixo</th>
                <th className="px-4 py-3">Tipo Manutenção</th>
                <th className="px-4 py-3">Descrição da Falha/Serviço</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {loadingTable ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">Carregando ordens de serviço...</td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                registros.map((r) => {
                  const isPendente = r.status.toLowerCase().includes('aberta') || r.status.toLowerCase().includes('pendente') || r.status.toLowerCase().includes('execu');
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400">{r.data_abertura}</td>
                      <td className="px-4 py-3 font-bold text-slate-200">{r.numero_os}</td>
                      <td className="px-4 py-3 font-bold text-cyan-400">{r.veiculo_prefixo}</td>
                      <td className="px-4 py-3 text-slate-400 font-sans">{r.tipo_manutencao}</td>
                      <td className="px-4 py-3 text-slate-200 font-sans max-w-xs truncate" title={r.descricao_servico}>{r.descricao_servico}</td>
                      <td className="px-4 py-3 text-right font-sans">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full font-semibold border ${
                          isPendente 
                            ? 'bg-amber-950 text-amber-400 border-amber-800' 
                            : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            Exibindo <span className="font-mono text-slate-200">{totalItems > 0 ? (page - 1) * pageSize + 1 : 0}</span> a{' '}
            <span className="font-mono text-slate-200">{Math.min(page * pageSize, totalItems)}</span> de{' '}
            <span className="font-mono font-bold text-cyan-400">{totalItems.toLocaleString('pt-BR')}</span> OSs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loadingTable}
              className="bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold transition-all"
            >
              ← Anterior
            </button>
            <span className="font-mono px-2 py-1 bg-slate-950 rounded border border-slate-800">
              Página <strong className="text-white">{page}</strong> de <strong className="text-slate-400">{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loadingTable}
              className="bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold transition-all"
            >
              Próxima →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
