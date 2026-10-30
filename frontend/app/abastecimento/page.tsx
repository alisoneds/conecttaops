'use client';

import { useEffect, useState, useMemo } from 'react';

interface MetricasAbastecimento {
  total_litros: number;
  total_km: number;
  media_kml: number;
  total_abastecimentos: number;
}

interface OutlierItem {
  prefixo: string;
  media_kml: number;
  total_litros: number;
  total_km: number;
}

interface RankingData {
  piores: OutlierItem[];
  melhores: OutlierItem[];
}

interface RegistroAbastecimento {
  id: number;
  chave: string;
  prefixo: string;
  data: string;
  litros: number;
  bomba: number;
  tanque: number;
  km_odometro: number;
  km_rodado: number;
  km_por_litro: number;
}

export default function AbastecimentoPage() {
  const [metricas, setMetricas] = useState<MetricasAbastecimento | null>(null);
  const [rankings, setRankings] = useState<RankingData>({ piores: [], melhores: [] });
  const [registros, setRegistros] = useState<RegistroAbastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPrefixo, setSearchPrefixo] = useState('');

  useEffect(() => {
    async function fetchAbastData() {
      setLoading(true);
      try {
        const [resMetrics, resRankings, resRegs] = await Promise.all([
          fetch('/api/v1/abastecimento/metrics'),
          fetch('/api/v1/abastecimento/ranking-outliers'),
          fetch('/api/v1/abastecimento?limit=150')
        ]);

        if (resMetrics.ok) {
          const data = await resMetrics.json();
          setMetricas(data);
        }
        if (resRankings.ok) {
          const data = await resRankings.json();
          setRankings(data);
        }
        if (resRegs.ok) {
          const data = await resRegs.json();
          setRegistros(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de abastecimento:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAbastData();
  }, []);

  const registrosFiltrados = useMemo(() => {
    if (!searchPrefixo.trim()) return registros;
    return registros.filter((r) =>
      r.prefixo.toLowerCase().includes(searchPrefixo.trim().toLowerCase())
    );
  }, [registros, searchPrefixo]);

  return (
    <main className="p-4 md:p-8 space-y-6">
      
      {/* Cabeçalho */}
      <header className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            ⛽ Módulo ABA: Abastecimento & Eficiência Energética
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Garagem 002 — JACAREI TRANSPORTE URBANO LTDA (JTU) | Dados consolidados desde 01/01/2026
          </p>
        </div>
      </header>

      {/* 4 KPIs Consolidadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Média Geral da Frota</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.media_kml ?? 0)} <span className="text-sm font-normal text-slate-500">Km/L</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Média ponderada acumulada</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Total de Litros Consumidos</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.total_litros ?? 0).toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">L</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Consumo nas bombas da garagem</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quilometragem Percorrida</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.total_km ?? 0).toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">Km</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Rodagem total registrada</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Eventos de Abastecimento</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.total_abastecimentos ?? 0).toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">regs</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Registros de automação de pista</p>
        </div>
      </div>

      {/* Painéis Executivos para Tomada de Decisão (Rankings) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Painel de Ofensores (Ação Imediata) */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                ⚠️ Top 5 Ofensores de Consumo (Menor Km/L)
              </h2>
              <p className="text-xs text-slate-400">Veículos com maior desvio — Requer ação de manutenção/instrução</p>
            </div>
            <span className="text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded">Ação Urgente</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-500 text-center py-4">A carregar indicadores...</p>
            ) : rankings.piores.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Nenhum veículo identificado.</p>
            ) : (
              rankings.piores.map((item, idx) => (
                <div key={item.prefixo} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-rose-950 text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-800 font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <strong className="text-sm font-mono text-cyan-400">{item.prefixo}</strong>
                      <span className="text-xs text-slate-500 block">
                        {item.total_litros.toLocaleString('pt-BR')} L consumidos ({item.total_km.toLocaleString('pt-BR')} Km)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-rose-400 font-mono">{item.media_kml}</span>
                    <span className="text-[10px] text-slate-500 block font-sans">Km/L médio</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Painel de Eficiência (Benchmark) */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                🏆 Top 5 Destaques de Eficiência (Maior Km/L)
              </h2>
              <p className="text-xs text-slate-400">Frota com melhor aproveitamento energético</p>
            </div>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">Benchmark</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-500 text-center py-4">A carregar indicadores...</p>
            ) : rankings.melhores.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Nenhum veículo identificado.</p>
            ) : (
              rankings.melhores.map((item, idx) => (
                <div key={item.prefixo} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-800 font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <strong className="text-sm font-mono text-cyan-400">{item.prefixo}</strong>
                      <span className="text-xs text-slate-500 block">
                        {item.total_litros.toLocaleString('pt-BR')} L consumidos ({item.total_km.toLocaleString('pt-BR')} Km)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono">{item.media_kml}</span>
                    <span className="text-[10px] text-slate-500 block font-sans">Km/L médio</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Histórico Auditado de Abastecimentos */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Eventos Recentes de Abastecimento em Pista</h2>
            <p className="text-xs text-slate-400">Registros diretos das bombas da Garagem 002 (JTU)</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filtrar por Prefixo..."
              value={searchPrefixo}
              onChange={(e) => setSearchPrefixo(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Prefixo</th>
                <th className="px-4 py-3">Litragem (L)</th>
                <th className="px-4 py-3">Km Rodado</th>
                <th className="px-4 py-3">Consumo (Km/L)</th>
                <th className="px-4 py-3">Bomba / Tanque</th>
                <th className="px-4 py-3 text-right">Status Rendimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    A carregar eventos de abastecimento...
                  </td>
                </tr>
              ) : registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((r) => {
                  const kml = r.km_por_litro;
                  let badge = (
                    <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Eficiente ({kml})
                    </span>
                  );

                  if (kml > 0 && kml < 2.3) {
                    badge = (
                      <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                        Crítico ({kml})
                      </span>
                    );
                  } else if (kml >= 2.3 && kml < 2.7) {
                    badge = (
                      <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                        Alerta ({kml})
                      </span>
                    );
                  }

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.data}</td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{r.prefixo}</td>
                      <td className="px-4 py-3 font-mono text-slate-200">{r.litros} L</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{r.km_rodado > 0 ? `${r.km_rodado} Km` : 'N/D'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-white">{kml > 0 ? kml : '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">Bomba #{r.bomba} | Tanque #{r.tanque}</td>
                      <td className="px-4 py-3 text-right">{badge}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}
