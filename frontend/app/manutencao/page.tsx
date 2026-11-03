'use client';

import { useEffect, useState, useCallback } from 'react';

interface MetricData {
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
  const [metrics, setMetrics] = useState<MetricData>({
    oss_pendentes: 0,
    total_oss: 0,
    oss_concluidas: 0,
  });

  const [oss, setOss] = useState<OSItem[]>([]);
  const [searchPrefixo, setSearchPrefixo] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 15;

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/manutencao/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Erro ao buscar métricas MAN:', err);
    }
  }, []);

  const fetchOSs = useCallback(async (pref: string, p: number) => {
    setLoading(true);
    try {
      const url = `/api/v1/manutencao?prefixo=${encodeURIComponent(pref)}&page=${p}&page_size=${pageSize}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOss(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.total_pages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar OSs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchMetrics();
    fetchOSs(searchPrefixo, page);
  }, [fetchMetrics, fetchOSs, searchPrefixo, page]);

  useEffect(() => {
    handleRefresh();

    // Escuta evento global disparado pelo botão Carga Manual do Top Navbar
    window.addEventListener('conecttaops-refresh', handleRefresh);
    return () => {
      window.removeEventListener('conecttaops-refresh', handleRefresh);
    };
  }, [handleRefresh]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            🛠️ Módulo MAN: Manutenção & Ordens de Serviço
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento e Execução de Oficina da Garagem 002 — JTU
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-6 glow-amber">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">OSs Pendentes</p>
          <p className="text-4xl font-black text-amber-400 font-mono mt-2">{metrics.oss_pendentes}</p>
          <p className="text-[11px] text-slate-400 mt-1">OSs Abertas / Em Execução (2026)</p>
        </div>

        <div className="glass-card rounded-2xl p-6 glow-cyan">
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Total de OSs (2026)</p>
          <p className="text-4xl font-black text-white font-mono mt-2">{metrics.total_oss.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Abertas desde 01/01/2026</p>
        </div>

        <div className="glass-card rounded-2xl p-6 glow-emerald">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">OSs Concluídas</p>
          <p className="text-4xl font-black text-emerald-400 font-mono mt-2">{metrics.oss_concluidas.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Finalizadas em Oficina (2026)</p>
        </div>
      </div>

      <section className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Histórico Geral de Intervenções</h2>
            <p className="text-xs text-slate-400">Listagem de todas as OSs atualizadas em tempo real</p>
          </div>
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filtrar por Prefixo..."
              value={searchPrefixo}
              onChange={(e) => {
                setSearchPrefixo(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950/80 border border-slate-800 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 w-full sm:w-72 font-mono shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Data Abertura</th>
                <th className="px-5 py-3.5">Nº OS</th>
                <th className="px-5 py-3.5">Prefixo</th>
                <th className="px-5 py-3.5">Tipo Manutenção</th>
                <th className="px-5 py-3.5">Descrição da Falha/Serviço</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-sans">Carregando ordens de serviço...</td>
                </tr>
              ) : oss.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-sans">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                oss.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400">{o.data_abertura}</td>
                    <td className="px-5 py-3.5 font-bold text-white">{o.numero_os}</td>
                    <td className="px-5 py-3.5 font-bold text-cyan-400">{o.veiculo_prefixo}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-sans">{o.tipo_manutencao}</td>
                    <td className="px-5 py-3.5 text-slate-200 font-sans max-w-md truncate" title={o.descricao_servico}>
                      {o.descricao_servico}
                    </td>
                    <td className="px-5 py-3.5 text-right font-sans">
                      <span className={`inline-block px-2.5 py-1 text-[10px] rounded-full font-bold uppercase border ${
                        o.status?.toUpperCase().includes('CONCLU') || o.status?.toUpperCase().includes('FINALIZ')
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-amber-950/80 text-amber-400 border-amber-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            Exibindo <span className="font-mono text-white font-bold">{totalItems > 0 ? (page - 1) * pageSize + 1 : 0}</span> a{' '}
            <span className="font-mono text-white font-bold">{Math.min(page * pageSize, totalItems)}</span> de{' '}
            <span className="font-mono font-extrabold text-cyan-400">{totalItems}</span> OSs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold transition-all"
            >
              ← Anterior
            </button>
            <span className="font-mono px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              Página <strong className="text-white">{page}</strong> de <strong className="text-slate-400">{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold transition-all"
            >
              Próxima →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
