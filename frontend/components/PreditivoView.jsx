'use client';

import React, { useState, useEffect, useMemo } from 'react';

export default function PreditivoView() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Filtros e Paginação
  const [buscaPrefixo, setBuscaPrefixo] = useState('');
  const [filtroRisco, setFiltroRisco] = useState('TODOS');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  const getApiUrl = (endpoint) => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `http://${hostname}:8000${endpoint}`;
    }
    return `http://localhost:8000${endpoint}`;
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const url = getApiUrl('/api/v1/preditivo/manutencao');
      const response = await fetch(url);
      const json = await response.json();
      if (json.data) {
        setDados(json.data);
      }
    } catch (error) {
      console.error('Erro ao buscar predições:', error);
    } finally {
      setLoading(false);
    }
  };

  const dispararAtualizacao = async () => {
    setAtualizando(true);
    setMensagem('');
    try {
      const url = getApiUrl('/api/v1/preditivo/atualizar');
      const response = await fetch(url, { method: 'POST' });

      if (response.ok) {
        setMensagem('Análise preditiva atualizada com sucesso pelo Núcleo Local!');
        await carregarDados();
      } else {
        setMensagem('Erro ao processar atualização no motor preditivo.');
      }
    } catch (error) {
      console.error('Erro ao disparar atualização:', error);
      setMensagem('Erro de conexão com o backend.');
    } finally {
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [buscaPrefixo, filtroRisco]);

  // KPIs
  const totalAnalisados = dados.length;
  const totalCriticos = useMemo(() => dados.filter(d => d.nivel_risco === 'Crítico').length, [dados]);
  const totalModerados = useMemo(() => dados.filter(d => d.nivel_risco === 'Moderado').length, [dados]);
  const totalBaixos = useMemo(() => dados.filter(d => d.nivel_risco === 'Baixo').length, [dados]);

  const ultimaAtualizacao = useMemo(() => {
    if (dados.length === 0 || !dados[0].atualizado_em) return 'N/D';
    return new Date(dados[0].atualizado_em).toLocaleString('pt-BR');
  }, [dados]);

  // Filtragem dos dados
  const dadosFiltrados = useMemo(() => {
    return dados.filter((item) => {
      const matchPrefixo = item.veiculo_prefixo?.toLowerCase().includes(buscaPrefixo.toLowerCase());
      const matchRisco = filtroRisco === 'TODOS' || item.nivel_risco === filtroRisco;
      return matchPrefixo && matchRisco;
    });
  }, [dados, buscaPrefixo, filtroRisco]);

  // Paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina) || 1;
  const dadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return dadosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [dadosFiltrados, paginaAtual, itensPorPagina]);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inteligência Preditiva & Auditoria</h1>
          <p className="text-gray-400 text-sm">Projeção de falhas mecânicas com base nas Ordens de Serviço (ERP Globus)</p>
        </div>
        <button
          onClick={dispararAtualizacao}
          disabled={atualizando}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {atualizando ? 'Processando Núcleo Local...' : '🔄 Atualizar Análise Preditiva'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Analisados</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{totalAnalisados}</p>
          <p className="text-xs text-gray-500 mt-1">Garagem 002 JTU</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-red-900/50">
          <p className="text-xs uppercase tracking-wider text-red-400 font-semibold">Risco Crítico</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{totalCriticos}</p>
          <p className="text-xs text-gray-500 mt-1">Inspeção urgente necessária</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-yellow-900/50">
          <p className="text-xs uppercase tracking-wider text-yellow-400 font-semibold">Risco Moderado / Baixo</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{totalModerados + totalBaixos}</p>
          <p className="text-xs text-gray-500 mt-1">{totalModerados} Moderado | {totalBaixos} Baixo</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Último Processamento</p>
          <p className="text-sm font-semibold text-gray-200 mt-2">{ultimaAtualizacao}</p>
          <p className="text-xs text-gray-500 mt-1">Motor Preditivo Local</p>
        </div>
      </div>

      {mensagem && (
        <div className="mb-4 p-3 bg-blue-900/50 text-blue-100 rounded text-sm border border-blue-700 flex justify-between items-center">
          <span>{mensagem}</span>
          <button onClick={() => setMensagem('')} className="text-xs text-blue-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-gray-800 p-4 rounded-t-lg border-t border-x border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por prefixo (ex: 0002790)..."
            value={buscaPrefixo}
            onChange={(e) => setBuscaPrefixo(e.target.value)}
            className="w-full sm:w-64 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          />

          <select
            value={filtroRisco}
            onChange={(e) => setFiltroRisco(e.target.value)}
            aria-label="Filtrar por nível de risco"
            className="w-full sm:w-auto bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="TODOS">Todos os Riscos</option>
            <option value="Crítico">Crítico</option>
            <option value="Moderado">Moderado</option>
            <option value="Baixo">Baixo</option>
          </select>
        </div>

        <div className="text-xs text-gray-400">
          Exibindo {dadosFiltrados.length} resultado(s)
        </div>
      </div>

      {/* Tabela de Dados */}
      {loading ? (
        <div className="bg-gray-800 p-8 rounded-b-lg border border-gray-700 text-center text-gray-400">
          Carregando dados preditivos...
        </div>
      ) : (
        <div className="bg-gray-800 rounded-b-lg border border-gray-700 overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-750 text-gray-300 text-xs uppercase tracking-wider border-b border-gray-700">
                  <th className="p-3">Prefixo</th>
                  <th className="p-3">Nível de Risco</th>
                  <th className="p-3">Probabilidade</th>
                  <th className="p-3">Última OS</th>
                  <th className="p-3">Última Intervenção</th>
                  <th className="p-3">Recomendação Operacional</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {dadosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-400">
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  dadosPaginados.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-750 transition">
                      <td className="p-3 font-mono font-bold text-blue-400">{item.veiculo_prefixo}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.nivel_risco === 'Crítico' ? 'bg-red-900/80 text-red-200 border border-red-700' :
                          item.nivel_risco === 'Moderado' ? 'bg-yellow-900/80 text-yellow-200 border border-yellow-700' : 
                          'bg-green-900/80 text-green-200 border border-green-700'
                        }`}>
                          {item.nivel_risco}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{item.probabilidade_falha}%</td>
                      <td className="p-3 font-mono">{item.ultima_os}</td>
                      <td className="p-3">
                        {item.data_ultima_intervencao ? new Date(item.data_ultima_intervencao).toLocaleDateString('pt-BR') : 'N/D'}
                      </td>
                      <td className="p-3 text-gray-300">{item.recomendacao}</td>
                      <td className="p-3 text-center">
                        <a
                          href={`/frota?prefixo=${item.veiculo_prefixo}`}
                          title="Ver Raio-X do Veículo"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-blue-300 rounded text-xs font-medium transition border border-gray-600"
                        >
                          🔍 Raio-X
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center text-sm">
              <span className="text-gray-400 text-xs">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
