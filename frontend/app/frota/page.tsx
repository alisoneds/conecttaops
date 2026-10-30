'use client';

import { useEffect, useState, useCallback } from 'react';

interface Veiculo {
  id: number;
  prefixo: string;
  placa: string;
  chassi: string;
  modelo: string;
  fabricante: string;
  ano_fabricacao: number;
  idade_formatada: string;
  status: string;
}

interface MetricasFrota {
  total_veiculos: number;
  os_pendentes: number;
  garagem: string;
}

interface RaioXData {
  veiculo: Veiculo;
  indicadores: {
    media_kml: number;
    total_litros: number;
    total_km: number;
    total_oss: number;
  };
}

interface OSItem {
  id: number;
  numero_os: string;
  data_abertura: string;
  status: string;
  descricao: string;
  tipo_manutencao: string;
}

export default function FrotaPage() {
  const [metricas, setMetricas] = useState<MetricasFrota | null>(null);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPrefixo, setSearchPrefixo] = useState('');

  // Modal Raio-X 360°
  const [selectedPrefixo, setSelectedPrefixo] = useState<string | null>(null);
  const [raioXData, setRaioXData] = useState<RaioXData | null>(null);
  const [loadingRaioX, setLoadingRaioX] = useState(false);

  // Paginação das OSs no Raio-X
  const [osItems, setOsItems] = useState<OSItem[]>([]);
  const [osPage, setOsPage] = useState(1);
  const [osPageSize] = useState(15);
  const [osTotalItems, setOsTotalItems] = useState(0);
  const [osTotalPages, setOsTotalPages] = useState(1);
  const [loadingOSs, setLoadingOSs] = useState(false);

  useEffect(() => {
    async function fetchFrotaData() {
      setLoading(true);
      try {
        const [resMetrics, resVeic] = await Promise.all([
          fetch('/api/v1/frota/metrics'),
          fetch('/api/v1/frota')
        ]);

        if (resMetrics.ok) {
          const data = await resMetrics.json();
          setMetricas(data);
        }
        if (resVeic.ok) {
          const data = await resVeic.json();
          setVeiculos(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de frota:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFrotaData();
  }, []);

  // Buscar dados paginados de OS do veículo selecionado
  const fetchOSsPaginadas = useCallback(async (prefixo: string, p: number) => {
    setLoadingOSs(true);
    try {
      const res = await fetch(`/api/v1/frota/${prefixo}/oss?page=${p}&page_size=${osPageSize}`);
      if (res.ok) {
        const data = await res.json();
        setOsItems(Array.isArray(data.items) ? data.items : []);
        setOsTotalItems(data.total || 0);
        setOsTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error(`Erro ao carregar OSs para ${prefixo}:`, err);
    } finally {
      setLoadingOSs(false);
    }
  }, [osPageSize]);

  // Abrir Modal e Carregar Raio-X 360°
  const handleOpenRaioX = async (prefixo: string) => {
    setSelectedPrefixo(prefixo);
    setLoadingRaioX(true);
    setOsPage(1);
    try {
      const res = await fetch(`/api/v1/frota/${prefixo}/raio-x`);
      if (res.ok) {
        const data = await res.json();
        setRaioXData(data);
      }
      await fetchOSsPaginadas(prefixo, 1);
    } catch (err) {
      console.error(`Erro ao abrir Raio-X de ${prefixo}:`, err);
    } finally {
      setLoadingRaioX(false);
    }
  };

  const handleOSPageChange = (newPage: number) => {
    if (!selectedPrefixo) return;
    setOsPage(newPage);
    fetchOSsPaginadas(selectedPrefixo, newPage);
  };

  const veiculosFiltrados = veiculos.filter((v) =>
    v.prefixo.toLowerCase().includes(searchPrefixo.trim().toLowerCase()) ||
    v.placa.toLowerCase().includes(searchPrefixo.trim().toLowerCase())
  );

  return (
    <main className="p-4 md:p-8 space-y-6">
      
      {/* Cabeçalho */}
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          🚌 Módulo FRT: Frota & Cadastros
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inventário de Veículos, Raio-X 360º e Monitoramento do Parque Rodante (Garagem 002 — JTU)
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Total de Ônibus</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.total_veiculos ?? 0)} <span className="text-sm font-normal text-slate-500">veículos</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">100% frota ativa em Jacareí</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">OSs Pendentes</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.os_pendentes ?? 0)} <span className="text-sm font-normal text-slate-500">em aberto</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Demandas de oficina (>= 2026)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Operação Garagem</p>
          <p className="text-lg font-bold text-white mt-2 font-mono">
            {loading ? '...' : (metricas?.garagem ?? 'Garagem 002 — JTU')}
          </p>
          <p className="text-xs text-slate-500 mt-2">Sincronização ERP Globus</p>
        </div>
      </div>

      {/* Tabela de Inventário de Veículos */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Inventário de Veículos</h2>
            <p className="text-xs text-slate-400">Clique em qualquer prefixo para abrir a visão executiva Raio-X 360º</p>
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar por Prefixo ou Placa..."
              value={searchPrefixo}
              onChange={(e) => setSearchPrefixo(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 w-full sm:w-64 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Prefixo</th>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Modelo / Fabricante</th>
                <th className="px-4 py-3">Ano Fabricação</th>
                <th className="px-4 py-3">Idade do Veículo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    A carregar cadastro de veículos...
                  </td>
                </tr>
              ) : veiculosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              ) : (
                veiculosFiltrados.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">{v.prefixo}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{v.placa}</td>
                    <td className="px-4 py-3 text-slate-200">{v.modelo} ({v.fabricante})</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{v.ano_fabricacao}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">{v.idade_formatada}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenRaioX(v.prefixo)}
                        className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  🔍 Raio-X 360º — Veículo <span className="text-cyan-400 font-mono">{selectedPrefixo}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Diagnóstico completo e histórico de oficina desde 01/01/2026</p>
              </div>
              <button
                onClick={() => { setSelectedPrefixo(null); setRaioXData(null); }}
                className="text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded-lg text-sm font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            {loadingRaioX ? (
              <p className="text-center py-12 text-slate-500 font-mono">A carregar diagnóstico do veículo...</p>
            ) : raioXData ? (
              <>
                {/* Ficha Técnica e KPIs do Veículo */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Modelo / Chassi</span>
                    <strong className="text-sm text-slate-200 block mt-1">{raioXData.veiculo.modelo}</strong>
                    <span className="text-xs font-mono text-slate-400">{raioXData.veiculo.chassi}</span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Média de Consumo</span>
                    <strong className="text-xl font-extrabold text-emerald-400 font-mono block mt-1">
                      {raioXData.indicadores.media_kml} <span className="text-xs text-slate-500 font-normal">Km/L</span>
                    </strong>
                    <span className="text-xs text-slate-500 block">
                      {raioXData.indicadores.total_litros.toLocaleString('pt-BR')} L em 2026
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Quilometragem Rodada</span>
                    <strong className="text-xl font-extrabold text-cyan-400 font-mono block mt-1">
                      {raioXData.indicadores.total_km.toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-normal">Km</span>
                    </strong>
                    <span className="text-xs text-slate-500 block">Acumulado em 2026</span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Idade do Veículo</span>
                    <strong className="text-xl font-extrabold text-white font-mono block mt-1">
                      {raioXData.veiculo.idade_formatada}
                    </strong>
                    <span className="text-xs text-slate-500 block">Ano {raioXData.veiculo.ano_fabricacao}</span>
                  </div>
                </div>

                {/* Tabela Paginada de OSs no Raio-X */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      🛠️ Últimas Intervenções de Oficina (OSs)
                    </h3>
                    <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
                      Total: <strong className="text-cyan-400">{osTotalItems}</strong> OSs
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-[11px] font-semibold uppercase text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2.5">Data OS</th>
                          <th className="px-3 py-2.5">Nº OS</th>
                          <th className="px-3 py-2.5">Tipo</th>
                          <th className="px-3 py-2.5">Descrição da Intervenção</th>
                          <th className="px-3 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {loadingOSs ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-slate-500">
                              A carregar registros de oficina...
                            </td>
                          </tr>
                        ) : osItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-slate-500 font-sans">
                              Nenhuma ordem de serviço registrada desde 01/01/2026.
                            </td>
                          </tr>
                        ) : (
                          osItems.map((os) => {
                            const isAberta = os.status?.toLowerCase().includes('aberta') || os.status?.toLowerCase().includes('pendente');
                            return (
                              <tr key={os.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="px-3 py-2 text-slate-400">{os.data_abertura}</td>
                                <td className="px-3 py-2 font-bold text-slate-200">{os.numero_os}</td>
                                <td className="px-3 py-2 text-slate-400 font-sans">{os.tipo_manutencao}</td>
                                <td className="px-3 py-2 text-slate-200 font-sans">{os.descricao}</td>
                                <td className="px-3 py-2 text-right">
                                  <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full font-semibold font-sans border ${
                                    isAberta 
                                      ? 'bg-amber-950 text-amber-400 border-amber-800' 
                                      : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                  }`}>
                                    {os.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação do Raio-X */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-400">
                    <div>
                      Exibindo <span className="font-mono text-slate-200">{osTotalItems > 0 ? (osPage - 1) * osPageSize + 1 : 0}</span> a{' '}
                      <span className="font-mono text-slate-200">{Math.min(osPage * osPageSize, osTotalItems)}</span> de{' '}
                      <span className="font-mono font-bold text-cyan-400">{osTotalItems.toLocaleString('pt-BR')}</span> OSs
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOSPageChange(Math.max(1, osPage - 1))}
                        disabled={osPage === 1 || loadingOSs}
                        className="bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 px-3 py-1 rounded border border-slate-800 font-semibold transition-all"
                      >
                        ← Anterior
                      </button>

                      <span className="font-mono px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                        Página <strong className="text-white">{osPage}</strong> de <strong className="text-slate-400">{osTotalPages}</strong>
                      </span>

                      <button
                        onClick={() => handleOSPageChange(Math.min(osTotalPages, osPage + 1))}
                        disabled={osPage >= osTotalPages || loadingOSs}
                        className="bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 px-3 py-1 rounded border border-slate-800 font-semibold transition-all"
                      >
                        Próxima →
                      </button>
                    </div>
                  </div>

                </div>
              </>
            ) : null}

          </div>
        </div>
      )}

    </main>
  );
}
