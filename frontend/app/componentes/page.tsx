'use client';

import { useEffect, useState, useCallback } from 'react';

interface MetricasCPN {
  total_veiculos_monitorados: number;
  total_agregados_ativos: number;
  intervencoes_2026: number;
  intervencoes_pneus: number;
  taxa_recapagem: string;
  garagem: string;
}

interface IncidenciaCategoria {
  categoria: string;
  icone: string;
  intervencoes: number;
}

interface IntervencaoComponente {
  id: number;
  numero_os: string;
  prefixo: string;
  data_abertura: string;
  status: string;
  descricao: string;
  tipo_manutencao: string;
}

export default function ComponentesPage() {
  const [metricas, setMetricas] = useState<MetricasCPN | null>(null);
  const [incidencias, setIncidencias] = useState<IncidenciaCategoria[]>([]);
  const [intervencoes, setIntervencoes] = useState<IntervencaoComponente[]>([]);
  
  // Estados de Paginação e Filtro
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [searchPrefixo, setSearchPrefixo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Carregar Métricas Gerais e Incidências
  useEffect(() => {
    async function fetchStaticData() {
      setLoading(true);
      try {
        const [resMetrics, resIncid] = await Promise.all([
          fetch('/api/v1/componentes/metrics'),
          fetch('/api/v1/componentes/top-incidencias')
        ]);

        if (resMetrics.ok) {
          const data = await resMetrics.json();
          setMetricas(data);
        }
        if (resIncid.ok) {
          const data = await resIncid.json();
          setIncidencias(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados fixos de CPN:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStaticData();
  }, []);

  // Carregar Intervenções Paginadas
  const fetchIntervencoes = useCallback(async (p: number, pref: string) => {
    setLoadingTable(true);
    try {
      const url = `/api/v1/componentes/intervencoes?page=${p}&page_size=${pageSize}&prefixo=${encodeURIComponent(pref)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIntervencoes(Array.isArray(data.items) ? data.items : []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error('Erro ao buscar intervenções paginadas:', err);
    } finally {
      setLoadingTable(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchIntervencoes(page, searchPrefixo);
  }, [page, searchPrefixo, fetchIntervencoes]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPrefixo(e.target.value);
    setPage(1); // Reseta para a primeira página ao filtrar
  };

  return (
    <main className="p-4 md:p-8 space-y-6">
      
      {/* Cabeçalho */}
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          ⚙️ Módulo CPN: Componentes & Agregados
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestão e Monitoramento de Pneus, Baterias, Trem de Força e Sistemas da Frota (Garagem 002 — JTU)
        </p>
      </header>

      {/* 4 KPIs de Componentes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Agregados em Operação</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.total_agregados_ativos ?? 0).toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">itens</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Pneus, Baterias e Trem de Força</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Intervenções em Agregados</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.intervencoes_2026 ?? 0).toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">OSs</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Manutenções registradas (&gt;= 2026)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Aproveitamento de Recapagem</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.taxa_recapagem ?? '0%')}
          </p>
          <p className="text-xs text-slate-500 mt-2">Índice de reutilização de vida do pneu</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Veículos Monitorados</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.total_veiculos_monitorados ?? 0)} <span className="text-sm font-normal text-slate-500">ônibus</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">100% da frota cadastrada na JTU</p>
        </div>
      </div>

      {/* Painel Executivo: Incidências por Categoria */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          📊 Distribuição de Intervenções por Sistema
        </h2>
        <p className="text-xs text-slate-400">Volume de OSs abertas agrupadas por categoria de componente</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {loading ? (
            <p className="text-xs text-slate-500 col-span-5 text-center py-4">A carregar categorias...</p>
          ) : (
            incidencias.map((item) => (
              <div key={item.categoria} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{item.icone}</span>
                  <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {item.intervencoes.toLocaleString('pt-BR')} OSs
                  </span>
                </div>
                <strong className="text-xs text-slate-200 block">{item.categoria}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Tabela Paginada de Histórico de Componentes */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Histórico de Manutenção de Componentes</h2>
            <p className="text-xs text-slate-400">Ordens de serviço referentes a troca/reparo de agregados e rodado desde 01/01/2026</p>
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
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Data OS</th>
                <th className="px-4 py-3">Nº OS</th>
                <th className="px-4 py-3">Prefixo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descrição da Intervenção</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loadingTable ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-mono">
                    A carregar registros da página {page}...
                  </td>
                </tr>
              ) : intervencoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhuma intervenção encontrada.
                  </td>
                </tr>
              ) : (
                intervencoes.map((item) => {
                  const isAberta = item.status?.toLowerCase().includes('aberta') || item.status?.toLowerCase().includes('pendente');
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{item.data_abertura}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">{item.numero_os}</td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{item.prefixo}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-400">{item.tipo_manutencao}</td>
                      <td className="px-4 py-3 text-xs text-slate-200">{item.descricao}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold border ${
                          isAberta 
                            ? 'bg-amber-950 text-amber-400 border-amber-800' 
                            : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            Exibindo <span className="font-mono text-slate-200">{totalItems > 0 ? (page - 1) * pageSize + 1 : 0}</span> a{' '}
            <span className="font-mono text-slate-200">{Math.min(page * pageSize, totalItems)}</span> de{' '}
            <span className="font-mono font-bold text-cyan-400">{totalItems.toLocaleString('pt-BR')}</span> ordens de serviço
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loadingTable}
              className="bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold transition-all"
            >
              ← Anterior
            </button>

            <span className="font-mono px-2 py-1 bg-slate-950 rounded border border-slate-800">
              Página <strong className="text-white">{page}</strong> de <strong className="text-slate-400">{totalPages}</strong>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
