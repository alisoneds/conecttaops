'use client';

import { useEffect, useState, useMemo } from 'react';

interface Veiculo {
  id: number;
  prefixo: string;
  placa: string;
  modelo_chassis: string;
  modelo_carroceria: string;
  ano_fabricacao: number;
  idade_formatada: string;
  status: string;
  garagem: string;
}

interface MetricasFrota {
  total_veiculos: number;
}

interface RaioXData {
  veiculo: {
    prefixo: string;
    placa: string;
    modelo_chassis: string;
    modelo_carroceria: string;
    garagem: string;
    status: string;
  };
  historico_os: Array<{
    id: number;
    numero_os: string;
    tipo_manutencao: string;
    status_os: string;
    data_abertura: string;
    descricao_servico?: string;
  }>;
  resumo_combustivel: {
    total_litros: number;
    total_km: number;
    media_kml: number;
    qtd_abastecimentos: number;
  };
}

export default function FrotaPage() {
  const [frota, setFrota] = useState<Veiculo[]>([]);
  const [metricas, setMetricas] = useState<MetricasFrota | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  // Modal Raio-X 360º
  const [selectedPrefixo, setSelectedPrefixo] = useState<string | null>(null);
  const [raioXData, setRaioXData] = useState<RaioXData | null>(null);
  const [loadingRaioX, setLoadingRaioX] = useState(false);

  useEffect(() => {
    async function fetchFrotaData() {
      setLoading(true);
      try {
        const [resFrota, resMetrics] = await Promise.all([
          fetch('/api/v1/frota'),
          fetch('/api/v1/frota/metrics')
        ]);

        if (resFrota.ok) {
          const dataFrota = await resFrota.json();
          setFrota(Array.isArray(dataFrota) ? dataFrota : []);
        }
        if (resMetrics.ok) {
          const dataMetrics = await resMetrics.json();
          setMetricas(dataMetrics);
        }
      } catch (err) {
        console.error('Erro ao carregar frota:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFrotaData();
  }, []);

  const abrirRaioX = async (prefixo: string) => {
    setSelectedPrefixo(prefixo);
    setLoadingRaioX(true);
    try {
      const res = await fetch(`/api/v1/frota/${prefixo}/raio-x`);
      if (res.ok) {
        const data = await res.json();
        setRaioXData(data);
      }
    } catch (err) {
      console.error('Erro ao carregar Raio-X do veículo:', err);
    } finally {
      setLoadingRaioX(false);
    }
  };

  const fecharRaioX = () => {
    setSelectedPrefixo(null);
    setRaioXData(null);
  };

  const frotaFiltrada = useMemo(() => {
    return frota.filter((v) => {
      const matchSearch = v.prefixo.toLowerCase().includes(search.toLowerCase()) ||
                          (v.placa && v.placa.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'TODOS' || v.status.toUpperCase() === statusFilter.toUpperCase();
      return matchSearch && matchStatus;
    });
  }, [frota, search, statusFilter]);

  return (
    <main className="p-4 md:p-8 space-y-6">
      
      {/* Cabeçalho */}
      <header className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            🚌 Módulo 1: Gestão de Frota
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Controle Cadastral de Ativos, Especificações Técnicas e Raio-X 360º dos Veículos
          </p>
        </div>
      </header>

      {/* KPI Frota Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frota Total Cadastrada</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.total_veiculos ?? frota.length)} <span className="text-sm font-normal text-slate-500">ônibus</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Garagem 002 — JTU</p>
        </div>
      </div>

      {/* Tabela de Veículos */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Inventário de Veículos</h2>
            <p className="text-xs text-slate-400">Detalhamento de chassis, carroceria e idade média da frota</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Pesquisar Prefixo ou Placa..."
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
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Prefixo</th>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Modelo Chassis</th>
                <th className="px-4 py-3">Modelo Carroceria</th>
                <th className="px-4 py-3">Idade do Veículo</th>
                <th className="px-4 py-3">Status Cadastral</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    A carregar inventário da frota...
                  </td>
                </tr>
              ) : frotaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              ) : (
                frotaFiltrada.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-400 text-base">{v.prefixo}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{v.placa || 'Sem Placa'}</td>
                    <td className="px-4 py-3 text-slate-300">{v.modelo_chassis}</td>
                    <td className="px-4 py-3 text-slate-300">{v.modelo_carroceria}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {v.idade_formatada} <span className="text-xs text-slate-500">({v.ano_fabricacao})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Ativo
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => abrirRaioX(v.prefixo)}
                        className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto"
                      >
                        🔍 Raio-X 360º
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Raio-X 360º */}
      {selectedPrefixo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-cyan-400 font-mono font-bold uppercase tracking-wider">Ficha Técnica do Veículo</span>
                <h2 className="text-2xl font-black text-white flex items-center gap-3 mt-0.5">
                  Ônibus Prefixo #{selectedPrefixo}
                </h2>
              </div>
              <button
                onClick={fecharRaioX}
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg text-sm font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            {loadingRaioX || !raioXData ? (
              <div className="py-12 text-center text-slate-500 font-mono">
                A carregar métricas detalhadas do veículo #{selectedPrefixo}...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block">Placa</span>
                    <strong className="text-slate-200 text-sm font-mono">{raioXData.veiculo.placa}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Chassis / Carroceria</span>
                    <strong className="text-slate-200 text-sm">{raioXData.veiculo.modelo_chassis}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Garagem Base</span>
                    <strong className="text-slate-200 text-sm">{raioXData.veiculo.garagem}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status Cadastral</span>
                    <strong className="text-emerald-400 text-sm">Ativo</strong>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    ⛽ Desempenho de Combustível (Acumulado DW)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-xs text-slate-500 block">Média Geral</span>
                      <strong className="text-xl font-bold text-emerald-400">{raioXData.resumo_combustivel.media_kml} <span className="text-xs text-slate-500 font-normal">Km/L</span></strong>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-xs text-slate-500 block">Litros Consumidos</span>
                      <strong className="text-xl font-bold text-white">{raioXData.resumo_combustivel.total_litros.toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-normal">L</span></strong>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-xs text-slate-500 block">Km Percorridos</span>
                      <strong className="text-xl font-bold text-white">{raioXData.resumo_combustivel.total_km.toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-normal">Km</span></strong>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-xs text-slate-500 block">Abastecimentos</span>
                      <strong className="text-xl font-bold text-cyan-400">{raioXData.resumo_combustivel.qtd_abastecimentos} <span className="text-xs text-slate-500 font-normal">regs</span></strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    🔧 Últimas Intervenções de Oficina (OSs)
                  </h3>
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 uppercase text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2.5">Nº OS</th>
                          <th className="px-3 py-2.5">Tipo</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5">Data Abertura</th>
                          <th className="px-3 py-2.5">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {raioXData.historico_os.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-slate-500">
                              Nenhuma OS registrada para este veículo.
                            </td>
                          </tr>
                        ) : (
                          raioXData.historico_os.map((os) => (
                            <tr key={os.id} className="hover:bg-slate-800/40">
                              <td className="px-3 py-2.5 font-mono text-cyan-400 font-medium">#{os.numero_os}</td>
                              <td className="px-3 py-2.5">{os.tipo_manutencao}</td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  os.status_os === 'Concluida' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                                }`}>
                                  {os.status_os}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-400">
                                {os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR') : '-'}
                              </td>
                              <td className="px-3 py-2.5 text-slate-400 max-w-xs truncate" title={os.descricao_servico}>
                                {os.descricao_servico || 'Sem descrição'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
