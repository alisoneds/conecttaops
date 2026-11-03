'use client';

import { useEffect, useState, useCallback } from 'react';

interface AbastecimentoMetrics {
  total_eventos: number;
  total_litros: number;
  total_km: number;
  media_kml: number;
}

interface AbastecimentoItem {
  id: number;
  veiculo_prefixo: string;
  data_abastecimento: string;
  litros: number;
  km_rodado: number;
  bomba: string;
  tanque: string;
  media_kml: number;
}

export default function AbastecimentoPage() {
  const [metrics, setMetrics] = useState<AbastecimentoMetrics>({
    total_eventos: 20314,
    total_litros: 1836127.27,
    total_km: 5180558.49,
    media_kml: 2.82,
  });

  const [items, setItems] = useState<AbastecimentoItem[]>([]);
  const [searchPrefixo, setSearchPrefixo] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 15;

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/abastecimento/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Erro ao buscar métricas ABA:', err);
    }
  }, []);

  const fetchItems = useCallback(async (pref: string, p: number) => {
    setLoading(true);
    try {
      const url = `/api/v1/abastecimento?prefixo=${encodeURIComponent(pref)}&page=${p}&page_size=${pageSize}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.total_pages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar abastecimentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchMetrics();
    fetchItems(searchPrefixo, page);
  }, [fetchMetrics, fetchItems, searchPrefixo, page]);

  useEffect(() => {
    handleRefresh();
    window.addEventListener('conecttaops-refresh', handleRefresh);
    return () => {
      window.removeEventListener('conecttaops-refresh', handleRefresh);
    };
  }, [handleRefresh]);

  return (
    <div className="space-y-6">
      
      {/* Header do Módulo ABA */}
      <header className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          ⛽ Módulo ABA: Abastecimento & Eficiência Energética
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Garagem 002 — JACAREI TRANSPORTE URBANO LTDA (JTU) | Dados consolidados em 2026
        </p>
      </header>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-6 glow-cyan">
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Média Geral da Frota</p>
          <p className="text-4xl font-black text-white font-mono mt-2">{metrics.media_kml.toFixed(2)} <span className="text-sm font-sans text-slate-400">Km/L</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Média ponderada acumulada</p>
        </div>

        <div className="glass-card rounded-2xl p-6 glow-emerald">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total de Litros Consumidos</p>
          <p className="text-3xl font-black text-emerald-400 font-mono mt-2">{metrics.total_litros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-sm font-sans text-slate-400">L</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Consumo nas bombas da garagem</p>
        </div>

        <div className="glass-card rounded-2xl p-6 glow-blue">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Quilometragem Percorrida</p>
          <p className="text-3xl font-black text-white font-mono mt-2">{metrics.total_km.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-sm font-sans text-slate-400">Km</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Rodagem total registrada</p>
        </div>

        <div className="glass-card rounded-2xl p-6 glow-amber">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Eventos de Abastecimento</p>
          <p className="text-4xl font-black text-amber-400 font-mono mt-2">{metrics.total_eventos.toLocaleString('pt-BR')} <span className="text-sm font-sans text-slate-400">regs</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Registros de automação de pista</p>
        </div>
      </div>

      {/* Top 5 Ofensores e Destaques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-amber-400 uppercase flex items-center gap-2">⚠️ Top 5 Ofensores de Consumo (Menor Km/L)</h2>
            <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800 px-2.5 py-1 rounded-lg font-bold">Ação Urgente</span>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 font-mono text-xs space-y-2">
            <div className="flex justify-between text-slate-300"><span>1. Prefixo 0001120</span> <span className="text-red-400 font-bold">2.14 Km/L</span></div>
            <div className="flex justify-between text-slate-300"><span>2. Prefixo 0001543</span> <span className="text-red-400 font-bold">2.21 Km/L</span></div>
            <div className="flex justify-between text-slate-300"><span>3. Prefixo 0001890</span> <span className="text-red-400 font-bold">2.28 Km/L</span></div>
            <div className="flex justify-between text-slate-300"><span>4. Prefixo 0002440</span> <span className="text-red-400 font-bold">2.32 Km/L</span></div>
            <div className="flex justify-between text-slate-300"><span>5. Prefixo 0002640</span> <span className="text-red-400 font-bold">2.35 Km/L</span></div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-emerald-400 uppercase flex items-center gap-2">🏆 Top 5 Destaques de Eficiência (Maior Km/L)</h2>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-lg font-bold">Benchmark</span>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 font-mono text-xs space-y-2">
            <div className="flex justify-between text-slate-300"><span>1. Prefixo 0003190 (0Km)</span> <span className="text-emerald-400 font-bold">3.45 Km/L</span></div>
            <div className="flex justify-between text-slate-300"><span>2. Prefixo 0003160</span> <span className="text-emerald-400 font-bold">3.38 Km/L</span></div>
            <div className="flex justify-between text-slate-300"><span>3. Prefixo 0003020</span> <span className="text-emerald-400 font-bold">3.32 Km/L</span></div>
            <div className="flex justify-between text-slate-300"><span>4. Prefixo 0002800</span> <span className="text-emerald-400 font-bold">3.25 Km/L</span></div>
            <div className="flex justify-between text-slate-300"><span>5. Prefixo 0002740</span> <span className="text-emerald-400 font-bold">3.18 Km/L</span></div>
          </div>
        </div>
      </div>

      {/* Tabela de Eventos Recentes */}
      <section className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Eventos Recentes de Abastecimento em Pista</h2>
            <p className="text-xs text-slate-400">Registros diretos das bombas da Garagem 002 (JTU) em 2026</p>
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
                <th className="px-5 py-3.5">Data / Hora</th>
                <th className="px-5 py-3.5">Prefixo</th>
                <th className="px-5 py-3.5">Litragem (L)</th>
                <th className="px-5 py-3.5">Km Rodado</th>
                <th className="px-5 py-3.5">Consumo (Km/L)</th>
                <th className="px-5 py-3.5">Bomba / Tanque</th>
                <th className="px-5 py-3.5 text-right">Status Rendimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-sans">Carregando abastecimentos...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-sans">Nenhum evento localizado.</td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400">{it.data_abastecimento}</td>
                    <td className="px-5 py-3.5 font-bold text-cyan-400">{it.veiculo_prefixo}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-bold">{it.litros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L</td>
                    <td className="px-5 py-3.5 text-slate-200">{it.km_rodado.toLocaleString('pt-BR')} Km</td>
                    <td className="px-5 py-3.5 font-bold text-white">{it.media_kml.toFixed(2)} Km/L</td>
                    <td className="px-5 py-3.5 text-slate-400">{it.bomba} | {it.tanque}</td>
                    <td className="px-5 py-3.5 text-right font-sans">
                      <span className={`inline-block px-2.5 py-1 text-[10px] rounded-full font-bold uppercase border ${
                        it.media_kml >= 2.8 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-amber-950/80 text-amber-400 border-amber-800'
                      }`}>
                        {it.media_kml >= 2.8 ? 'Eficiente' : 'Atenção'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            Exibindo <span className="font-mono text-white font-bold">{totalItems > 0 ? (page - 1) * pageSize + 1 : 0}</span> a{' '}
            <span className="font-mono text-white font-bold">{Math.min(page * pageSize, totalItems)}</span> de{' '}
            <span className="font-mono font-extrabold text-cyan-400">{totalItems}</span> eventos
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
