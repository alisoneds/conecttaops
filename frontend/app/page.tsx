'use client';

import { useEffect, useState } from 'react';
import { Wrench, Bus, CheckCircle2, AlertCircle } from 'lucide-react';

interface Veiculo {
  id: number;
  prefixo: string;
  placa: string;
  modelo: string;
  status: string;
  garagem: string;
}

export default function Home() {
  const [dbStatus, setDbStatus] = useState<string>('A verificar...');
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Valida conexão à DB
        const resDb = await fetch('http://192.168.50.101:8000/api/health/db');
        const dataDb = await resDb.json();
        setDbStatus(dataDb.status === 'success' ? 'Online' : 'Erro');

        // Procura frota
        const resFrota = await fetch('http://192.168.50.101:8000/api/frota/');
        const dataFrota = await resFrota.json();
        setVeiculos(dataFrota);
      } catch (err) {
        setDbStatus('Indisponível');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="max-w-6xl mx-auto flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Wrench size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ConecttaOps</h1>
            <p className="text-sm text-slate-400">HUB de Inovação Operacional — Garagem 2 (JTU)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">PostgreSQL DW:</span>
          {dbStatus === 'Online' ? (
            <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-medium">
              <CheckCircle2 size={14} /> Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full font-medium">
              <AlertCircle size={14} /> {dbStatus}
            </span>
          )}
        </div>
      </header>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Total na Frota</span>
            <Bus className="text-blue-400" size={20} />
          </div>
          <p className="text-3xl font-bold">{veiculos.length}</p>
        </div>
      </section>
    </main>
  );
}
