'use client';

import { useEffect, useState } from 'react';

interface MetricasSync {
  status_ultimo_sync: string;
  ultima_execucao: string;
  total_sincronizacoes: number;
  lidos_oracle: number;
  aprovados_auditoria: number;
  rejeitados: number;
}

export default function GovernancaPage() {
  const [metricas, setMetricas] = useState<MetricasSync | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function fetchGovernancaData() {
    setLoading(true);
    try {
      const [resMetrics, resLogs] = await Promise.all([
        fetch('/api/v1/governanca/metrics'),
        fetch('/api/v1/governanca/logs')
      ]);

      if (resMetrics.ok) {
        const dataMetrics = await resMetrics.json();
        setMetricas(dataMetrics);
      }
      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        setLogs(Array.isArray(dataLogs) ? dataLogs : []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de governança:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGovernancaData();
  }, []);

  const dispararSyncManual = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/v1/governanca/trigger', { method: 'POST' });
      if (res.ok) {
        await fetchGovernancaData();
      }
    } catch (err) {
      console.error('Erro ao disparar sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="p-4 md:p-8 space-y-6">
      <header className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            🛡️ Governança & Auditoria DataAuditor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitoramento ETL Globus Oracle -> PostgreSQL (Janela estrita >= 01/01/2026)
          </p>
        </div>
        <button
          onClick={dispararSyncManual}
          disabled={syncing}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-cyan-400/30 transition-all flex items-center gap-2"
        >
          {syncing ? '🔄 Sincronizando...' : '⚡ Disparar Carga Manual'}
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status do Sync</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">
            {loading ? '...' : (metricas?.status_ultimo_sync ?? 'SUCCESS')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Sincronização Diária 03:00 AM</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Última Carga</p>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {loading ? '...' : (metricas?.ultima_execucao ?? '01/01/2026 03:00')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Execuções: {metricas?.total_sincronizacoes ?? 1}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Aprovados Auditoria</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.aprovados_auditoria ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Sanitizados via DataAuditor</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Registros Rejeitados</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {loading ? '...' : (metricas?.rejeitados ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Anomalias de formato/regras</p>
        </div>
      </div>
    </main>
  );
}
