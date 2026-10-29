'use client';

import { useEffect, useState } from 'react';

interface MetricOs {
  os_em_aberto: number;
  preventivas: number;
  corretivas: number;
}

export default function Home() {
  const [totalFrota, setTotalFrota] = useState<number | null>(null);
  const [metricasOs, setMetricasOs] = useState<MetricOs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resFrota, resOs] = await Promise.all([
          fetch('http://192.168.50.101:8000/api/frota/'),
          fetch('http://192.168.50.101:8000/api/os/metrics')
        ]);
        
        const dataFrota = await resFrota.json();
        const dataOs = await resOs.json();

        setTotalFrota(Array.isArray(dataFrota) ? dataFrota.length : 0);
        setMetricasOs(dataOs);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">ConecttaOps</h1>
            <p className="text-sm text-slate-400">Garagem 002 — Jacareí Transporte Urbano (JTU)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-emerald-400">AUDITORIA ATIVA</span>
          </div>
        </header>

        {/* Grid de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Frota */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-400">Frota Ativa Operacional</p>
            <p className="text-4xl font-extrabold text-white mt-2">
              {loading ? '...' : totalFrota}
            </p>
            <p className="text-xs text-slate-500 mt-2">Tipos 016, 029, 057</p>
          </div>

          {/* OS em Aberto */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-amber-400">OSs em Aberto</p>
            <p className="text-4xl font-extrabold text-white mt-2">
              {loading ? '...' : metricasOs?.os_em_aberto}
            </p>
            <p className="text-xs text-slate-500 mt-2">Requer atenção em oficina</p>
          </div>

          {/* Manutenções Preventivas */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-blue-400">Preventivas (desde 2024)</p>
            <p className="text-4xl font-extrabold text-white mt-2">
              {loading ? '...' : metricasOs?.preventivas.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-slate-500 mt-2">Planos de revisão</p>
          </div>

          {/* Manutenções Corretivas */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-rose-400">Corretivas (desde 2024)</p>
            <p className="text-4xl font-extrabold text-white mt-2">
              {loading ? '...' : metricasOs?.corretivas.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-slate-500 mt-2">Intervenções de reparo</p>
          </div>
        </div>

      </div>
    </main>
  );
}
