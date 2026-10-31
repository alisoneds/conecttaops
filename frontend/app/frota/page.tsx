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
  tipo_manutencao: string;
  descricao: string;
}

export default function FrotaPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [searchPrefixo, setSearchPrefixo] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Estado do Modal Raio-X 360º
  const [selectedPrefixo, setSelectedPrefixo] = useState<string | null>(null);
  const [raioXData, setRaioXData] = useState<RaioXData | null>(null);
  const [loadingRaioX, setLoadingRaioX] = useState(false);
  
  // Estado da Lista de OSs Paginada do Veículo no Modal
  const [ossList, setOssList] = useState<OSItem[]>([]);
  const [ossPage, setOssPage] = useState(1);
  const [ossTotalPages, setOssTotalPages] = useState(1);
  const [ossTotalItems, setOssTotalItems] = useState(0);
  const [loadingOSs, setLoadingOSs] = useState(false);

  const fetchFrota = useCallback(async (pref: string) => {
    setLoading(true);
    try {
      const url = `/api/v1/frota?prefixo=${encodeURIComponent(pref)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVeiculos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar frota:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFrota(searchPrefixo);
  }, [searchPrefixo, fetchFrota]);

  // Função para abrir o Raio-X 360º do Veículo
  const handleOpenRaioX = async (prefixo: string) => {
    setSelectedPrefixo(prefixo);
    setLoadingRaioX(true);
    setOssPage(1);
    try {
      // Busca os indicadores consolidados do veículo
      const resRx = await fetch(`/api/v1/frota/${prefixo}/raio-x`);
      if (resRx.ok) {
        const dataRx = await resRx.json();
        setRaioXData(dataRx);
      }
      // Busca as OSs paginadas do veículo (página 1)
      fetchVehicleOSs(prefixo, 1);
    } catch (err) {
      console.error('Erro ao abrir Raio-X:', err);
    } finally {
      setLoadingRaioX(false);
    }
  };

  const fetchVehicleOSs = async (prefixo: string, p: number) => {
    setLoadingOSs(true);
    try {
      const res = await fetch(`/api/v1/frota/${prefixo}/oss?page=${p}&page_size=15`);
      if (res.ok) {
        const data = await res.json();
        setOssList(Array.isArray(data.items) ? data.items : []);
        setOssTotalPages(data.total_pages || 1);
        setOssTotalItems(data.total || 0);
        setOssPage(data.page || 1);
      }
    } catch (err) {
      console.error('Erro ao buscar OSs do veículo:', err);
    } finally {
      setLoadingOSs(false);
    }
  };

  const handleOssPageChange = (newPage: number) => {
    if (selectedPrefixo) {
      fetchVehicleOSs(selectedPrefixo, newPage);
    }
  };

  const closeModal = () => {
    setSelectedPrefixo(null);
    setRaioXData(null);
    setOssList([]);
  };

  // Paginação da tabela principal
  const totalItems = veiculos.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedVeiculos = veiculos.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="p-4 md:p-8 space-y-6">
      
      {/* Header com indicador de Garagem */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            🚌 Módulo FRT: Gestão & Inventário da Frota
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Governança da Garagem 002 — JTU Jacareí Transporte Urbano LTDA
          </p>
        </div>
        <div className="bg-cyan-950/40 border border-cyan-800/50 px-4 py-2 rounded-xl text-xs font-mono text-cyan-400 font-semibold shadow-sm">
          Frota Ativa: <span className="text-white font-extrabold text-sm font-mono ml-1">97 Veículos</span>
        </div>
      </header>

      {/* Tabela Executiva com Glassmorphism */}
      <section className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Inventário Geral de Veículos</h2>
            <p className="text-xs text-slate-400">Idade formatada por tempo de uso no sistema Globus</p>
          </div>
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar por Prefixo (ex: 0001120)..."
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
                <th className="px-5 py-3.5">Prefixo</th>
                <th className="px-5 py-3.5">Placa</th>
                <th className="px-5 py-3.5">Modelo / Fabricante</th>
                <th className="px-5 py-3.5">Ano Fab.</th>
                <th className="px-5 py-3.5">Idade do Veículo</th>
                <th className="px-5 py-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-sans">Carregando frota de ônibus...</td>
                </tr>
              ) : paginatedVeiculos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-sans">Nenhum veículo localizado.</td>
                </tr>
              ) : (
                paginatedVeiculos.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-cyan-400">{v.prefixo}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-300">{v.placa}</td>
                    <td className="px-5 py-3.5 text-slate-200 font-sans">{v.modelo} ({v.fabricante})</td>
                    <td className="px-5 py-3.5 text-slate-400">{v.ano_fabricacao}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-400 font-sans">{v.idade_formatada}</td>
                    <td className="px-5 py-3.5 text-right font-sans">
                      <button 
                        onClick={() => handleOpenRaioX(v.prefixo)}
                        className="bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 active:scale-95"
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

        {/* Controles de Paginação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            Exibindo <span className="font-mono text-white font-bold">{totalItems > 0 ? (page - 1) * pageSize + 1 : 0}</span> a{' '}
            <span className="font-mono text-white font-bold">{Math.min(page * pageSize, totalItems)}</span> de{' '}
            <span className="font-mono font-extrabold text-cyan-400">{totalItems}</span> veículos
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

      {/* Modal Executivo: Raio-X 360º */}
      {selectedPrefixo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-cyan-400 font-mono flex items-center gap-2">
                  🔍 Raio-X 360º — Prefixo {selectedPrefixo}
                </span>
                {raioXData?.veiculo && (
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-sans font-medium">
                    {raioXData.veiculo.modelo} ({raioXData.veiculo.placa})
                  </span>
                )}
              </div>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingRaioX ? (
                <div className="py-12 text-center text-slate-400 font-sans">Carregando indicadores do Raio-X...</div>
              ) : (
                <>
                  {/* KPIs do Veículo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Ponderada</p>
                      <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
                        {raioXData?.indicadores.media_kml.toFixed(2)} <span className="text-xs text-slate-400 font-sans">Km/L</span>
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Litros Consumidos</p>
                      <p className="text-2xl font-black text-white font-mono mt-1">
                        {raioXData?.indicadores.total_litros.toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-sans">L</span>
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Km Rodado</p>
                      <p className="text-2xl font-black text-white font-mono mt-1">
                        {raioXData?.indicadores.total_km.toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-sans">Km</span>
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intervenções (OSs)</p>
                      <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                        {raioXData?.indicadores.total_oss}
                      </p>
                    </div>
                  </div>

                  {/* Histórico de OSs do Veículo */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white tracking-tight">Histórico de Ordens de Serviço (2026)</h3>
                      <span className="text-xs font-mono text-slate-400">Total: {ossTotalItems} OSs</span>
                    </div>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="px-4 py-2.5">Data Abertura</th>
                            <th className="px-4 py-2.5">Nº OS</th>
                            <th className="px-4 py-2.5">Tipo</th>
                            <th className="px-4 py-2.5">Descrição do Serviço</th>
                            <th className="px-4 py-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {loadingOSs ? (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-500 font-sans">Carregando histórico de manutenção...</td>
                            </tr>
                          ) : ossList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-500 font-sans">Nenhuma OS registrada para este veículo.</td>
                            </tr>
                          ) : (
                            ossList.map((os) => (
                              <tr key={os.id} className="hover:bg-slate-800/40">
                                <td className="px-4 py-2.5 text-slate-400">{os.data_abertura}</td>
                                <td className="px-4 py-2.5 font-bold text-slate-200">{os.numero_os}</td>
                                <td className="px-4 py-2.5 text-slate-400 font-sans">{os.tipo_manutencao}</td>
                                <td className="px-4 py-2.5 text-slate-300 font-sans max-w-xs truncate" title={os.descricao}>{os.descricao}</td>
                                <td className="px-4 py-2.5 text-right font-sans">
                                  <span className="inline-block px-2 py-0.5 text-[9px] rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                    {os.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação do Modal */}
                    {ossTotalPages > 1 && (
                      <div className="flex justify-between items-center text-xs text-slate-400 pt-2 font-mono">
                        <span>Página {ossPage} de {ossTotalPages}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOssPageChange(ossPage - 1)}
                            disabled={ossPage === 1 || loadingOSs}
                            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40"
                          >
                            ← Anterior
                          </button>
                          <button
                            onClick={() => handleOssPageChange(ossPage + 1)}
                            disabled={ossPage >= ossTotalPages || loadingOSs}
                            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40"
                          >
                            Próxima →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
