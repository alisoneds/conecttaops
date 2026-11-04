'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  User, 
  Package, 
  Search, 
  Filter, 
  X, 
  FileText
} from 'lucide-react';

interface Executante {
  funcionario_executante: string;
  horas_executante: string;
  valor_mo_executante: string | number;
}

interface Material {
  numero_requisicao: string;
  data_aplicacao?: string;
  material_descricao: string;
  quantidade: number;
  valor_unitario?: number;
  valor_total: number | string;
  km_ultima_troca?: number;
  data_ultima_troca?: string;
}

interface OS {
  numero_os: string;
  veiculo_prefixo: string;
  tipo_manutencao: string;
  descricao_servico?: string;
  data_abertura: string;
  status: string;
  empresa_codigo?: string;
  filial_codigo?: string;
  garagem_codigo?: string;
  data_fechamento?: string;
  data_retorno?: string;
  origem_solicitacao?: string;
  usuario_abertura?: string;
  total_horas?: string;
  km_acumulado?: number;
  valor_mao_de_obra?: number | string;
  valor_materiais?: number | string;
  valor_total_geral?: number | string;
  status_execucao?: string;
  fornecedor_terceiro?: string;
  grupo_servico?: string;
  grupo_defeito?: string;
  defeito_descricao?: string;
  tipo_operacao?: string;
  complemento_observacao?: string;
  executantes?: Executante[];
  materiais?: Material[];
}

export default function ManutencaoPage() {
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('TODOS');
  const [osSelecionadaModal, setOsSelecionadaModal] = useState<OS | null>(null);

  useEffect(() => {
    async function fetchOS() {
      try {
        const res = await fetch('/api/v1/manutencao/os');
        if (res.ok) {
          const data = await res.json();
          setOrdens(data);
        } else {
          setOrdens(mockOSData);
        }
      } catch (e) {
        setOrdens(mockOSData);
      } finally {
        setLoading(false);
      }
    }
    fetchOS();
  }, []);

  const handleAbrirOSModal = async (os: OS) => {
    try {
      const res = await fetch(`/api/v1/manutencao/os/${os.numero_os}`);
      if (res.ok) {
        const detalhe = await res.json();
        setOsSelecionadaModal(detalhe);
      } else {
        setOsSelecionadaModal(os);
      }
    } catch (e) {
      setOsSelecionadaModal(os);
    }
  };

  const filteredOrdens = ordens.filter(os => {
    const matchesSearch = os.numero_os.includes(searchTerm) || os.veiculo_prefixo.includes(searchTerm);
    const matchesTipo = filterTipo === 'TODOS' || os.tipo_manutencao === filterTipo;
    return matchesSearch && matchesTipo;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
            <Wrench className="w-7 h-7 text-blue-500" />
            MAN - Módulo de Manutenção (Garagem 002 - JTU)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestão de OSs e Integração Tela Interativa ERP Globus
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ETL Globus Ativo (03:00 AM)
          </span>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            <span>Total de OSs</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{ordens.length}</p>
          <p className="text-xs text-slate-500 mt-1">Acumulado no período</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            <span>Corretivas (C)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">
            {ordens.filter(o => o.tipo_manutencao === 'C').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Manutenções não planejadas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            <span>Preventivas (P)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">
            {ordens.filter(o => o.tipo_manutencao === 'P').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Revisões programadas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            <span>Total Custo OSs</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            R$ {ordens.reduce((acc, curr) => acc + (Number(curr.valor_total_geral) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Mão de Obra + Peças</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nº OS ou Prefixo do Veículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Tipo:</span>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="C">Corretiva (C)</option>
            <option value="P">Preventiva (P)</option>
          </select>
        </div>
      </div>

      {/* Tabela de Ordens de Serviço */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Histórico Geral de Intervenções (Clique para abrir a Tela Interativa)
          </h2>
          <span className="text-xs text-slate-400">{filteredOrdens.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Emp/Fil/Gar</th>
                <th className="p-4">Nº O.S.</th>
                <th className="p-4">Veículo</th>
                <th className="p-4">Data Abertura</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Serviço / Defeito</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Carregando registros do banco de dados...
                  </td>
                </tr>
              ) : filteredOrdens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhuma Ordem de Serviço encontrada.
                  </td>
                </tr>
              ) : (
                filteredOrdens.map((os) => (
                  <tr 
                    key={os.numero_os} 
                    onClick={() => handleAbrirOSModal(os)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono text-xs text-slate-400">
                      {os.empresa_codigo || '002'}/{os.filial_codigo || '001'}/{os.garagem_codigo || '002'}
                    </td>
                    <td className="p-4 font-bold text-blue-400 font-mono">#{os.numero_os}</td>
                    <td className="p-4 font-semibold text-white">{os.veiculo_prefixo}</td>
                    <td className="p-4 text-slate-300">{os.data_abertura}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        os.tipo_manutencao === 'C' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {os.tipo_manutencao === 'C' ? 'Corretiva' : 'Preventiva'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">
                      {os.defeito_descricao || os.descricao_servico || 'Manutenção Geral'}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {os.status || os.status_execucao || 'CONCLUÍDA'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-emerald-400">
                      R$ {Number(os.valor_total_geral || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Interativo da OS (Tela Interativa ERP Globus) */}
      {osSelecionadaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Topo do Modal */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <span className="bg-blue-600/20 text-blue-400 font-bold px-3 py-1 rounded border border-blue-500/30 font-mono">
                  O.S. #{osSelecionadaModal.numero_os}
                </span>
                <span className="text-slate-200 font-semibold text-lg">Veículo {osSelecionadaModal.veiculo_prefixo}</span>
                <span className="text-xs bg-slate-950 text-slate-400 px-2.5 py-1 rounded border border-slate-800 font-mono">
                  Emp: {osSelecionadaModal.empresa_codigo || '002'} | Fil: {osSelecionadaModal.filial_codigo || '001'} | Garagem: {osSelecionadaModal.garagem_codigo || '002'}
                </span>
              </div>
              <button 
                onClick={() => setOsSelecionadaModal(null)} 
                className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo Scrollável da Tela Interativa */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Bloco 1: Métricas de Tempo e Odômetro */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <p className="text-xs text-slate-400">Total Horas</p>
                  <p className="text-base font-bold text-white mt-1">{osSelecionadaModal.total_horas || '01:10:00'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Km Acumulado</p>
                  <p className="text-base font-bold text-sky-400 mt-1">{osSelecionadaModal.km_acumulado ? osSelecionadaModal.km_acumulado.toLocaleString('pt-BR') : '12.167'} km</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Mão de Obra</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    R$ {Number(osSelecionadaModal.valor_mao_de_obra || 13.65).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Geral OS</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    R$ {Number(osSelecionadaModal.valor_total_geral || 13.65).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Bloco 2: Serviços & Defeitos */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  Serviços & Defeitos Registrados (Globus)
                </h4>
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Grp. Serviço Executado</p>
                    <p className="text-slate-200 font-medium mt-0.5">{osSelecionadaModal.grupo_servico || '100 - TAPEÇARIA'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Serviço Executado</p>
                    <p className="text-slate-200 font-medium mt-0.5">{osSelecionadaModal.descricao_servico || '002 - VERIFICAR ASSENTO'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Grp. Defeito</p>
                    <p className="text-slate-200 font-medium mt-0.5">{osSelecionadaModal.grupo_defeito || '100 - TAPEÇARIA'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Defeito Apontado</p>
                    <p className="text-amber-400 font-medium mt-0.5">{osSelecionadaModal.defeito_descricao || '007 - BANCO QUEBRADO'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tp. Operação</p>
                    <p className="text-emerald-400 font-medium mt-0.5">{osSelecionadaModal.tipo_operacao || '051 - REPARADO'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Complemento</p>
                    <p className="text-slate-300 mt-0.5">{osSelecionadaModal.complemento_observacao || 'BANCO DO CADEIRANTE'}</p>
                  </div>
                </div>
              </div>

              {/* Bloco 3: Executantes do Serviço */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Executantes do Serviço (Mão de Obra)
                </h4>
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400">
                      <tr>
                        <th className="p-3">Funcionário Executante</th>
                        <th className="p-3">Horas Dedicadas</th>
                        <th className="p-3 text-right">Custo Mão de Obra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {(osSelecionadaModal.executantes && osSelecionadaModal.executantes.length > 0 ? osSelecionadaModal.executantes : [
                        { funcionario_executante: '002834 - THIAGO CARLINI MONTEIRO', horas_executante: '01:10', valor_mo_executante: '13.65' }
                      ]).map((exec, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-medium text-white">{exec.funcionario_executante}</td>
                          <td className="p-3">{exec.horas_executante}</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">
                            R$ {Number(exec.valor_mo_executante || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bloco 4: Materiais Aplicados */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  Materiais & Peças Aplicadas (Estoque)
                </h4>
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden p-1">
                  {osSelecionadaModal.materiais && osSelecionadaModal.materiais.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-slate-400">
                        <tr>
                          <th className="p-3">Requisição</th>
                          <th className="p-3">Material</th>
                          <th className="p-3">Qtd</th>
                          <th className="p-3 text-right">Vlr Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {osSelecionadaModal.materiais.map((mat, i) => (
                          <tr key={i}>
                            <td className="p-3 font-mono">{mat.numero_requisicao}</td>
                            <td className="p-3 font-medium text-white">{mat.material_descricao}</td>
                            <td className="p-3">{mat.quantidade}</td>
                            <td className="p-3 text-right text-emerald-400 font-semibold">
                              R$ {Number(mat.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Nenhum material de estoque requisitado para esta Ordem de Serviço.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Rodapé do Modal */}
            <div className="bg-slate-800 px-6 py-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
              <span>Origem: {osSelecionadaModal.origem_solicitacao || '001 - TRAFEGO (RECOL...)'}</span>
              <span>Aberto por: {osSelecionadaModal.usuario_abertura || 'EDUARDOR'}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const mockOSData: OS[] = [
  {
    numero_os: '0195934',
    veiculo_prefixo: '0003190',
    tipo_manutencao: 'C',
    descricao_servico: '002 - VERIFICAR ASSENTO',
    data_abertura: '29/10/2026 00:19',
    status: 'FECHADA',
    empresa_codigo: '002',
    filial_codigo: '001',
    garagem_codigo: '002',
    total_horas: '01:10:00',
    km_acumulado: 12167,
    valor_mao_de_obra: 13.65,
    valor_materiais: 0.00,
    valor_total_geral: 13.65,
    grupo_servico: '100 - TAPEÇARIA',
    grupo_defeito: '100 - TAPEÇARIA',
    defeito_descricao: '007 - BANCO QUEBRADO',
    tipo_operacao: '051 - REPARADO',
    complemento_observacao: 'BANCO DO CADEIRANTE',
    origem_solicitacao: '001 - TRAFEGO (RECOL...)',
    usuario_abertura: 'EDUARDOR',
    executantes: [
      { funcionario_executante: '002834 - THIAGO CARLINI MONTEIRO', horas_executante: '01:10', valor_mo_executante: 13.65 }
    ]
  },
  {
    numero_os: '0196030',
    veiculo_prefixo: '0003195',
    tipo_manutencao: 'P',
    descricao_servico: '010 - REVISÃO PREVENTIVA 10K',
    data_abertura: '01/11/2026 08:30',
    status: 'FECHADA',
    empresa_codigo: '002',
    filial_codigo: '001',
    garagem_codigo: '002',
    total_horas: '03:45:00',
    km_acumulado: 45200,
    valor_mao_de_obra: 120.00,
    valor_materiais: 450.00,
    valor_total_geral: 570.00,
    grupo_servico: '200 - MOTOR / LUBRIFICAÇÃO',
    grupo_defeito: '200 - REVISÃO PROGRAMADA',
    defeito_descricao: 'TROCA DE ÓLEO E FILTROS',
    tipo_operacao: '010 - SUBSTITUÍDO',
    complemento_observacao: 'FILTROS DE AR E ÓLEO TROCADOS',
    origem_solicitacao: 'PLANERA MANUTENÇÃO',
    usuario_abertura: 'MARCIOS',
    executantes: [
      { funcionario_executante: '001920 - CARLOS ALBERTO', horas_executante: '03:45', valor_mo_executante: 120.00 }
    ],
    materiais: [
      { numero_requisicao: 'REQ-88912', material_descricao: 'ÓLEO LUBRIFICANTE 15W40', quantidade: 20, valor_total: 360.00 },
      { numero_requisicao: 'REQ-88913', material_descricao: 'FILTRO DE ÓLEO DIESEL', quantidade: 1, valor_total: 90.00 }
    ]
  }
];
