'use client';

import './globals.css';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('03:00 AM OK');

  const handleGlobalRefresh = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/v1/etl/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLastSyncText(`${data.ultima_atualizacao} OK`);
        // Dispara evento global para recarregar os dados da página ativa em tempo real
        window.dispatchEvent(new Event('conecttaops-refresh'));
      }
    } catch (err) {
      console.error('Erro ao acionar Carga Manual Global:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
        
        {/* Top Navbar Executiva com Carga Manual Unificada */}
        <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">CONECTTAOPS</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded">v1.6.0</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">HUB Operacional — Garagem 002 (JTU Jacareí)</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Links dos Módulos */}
            <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <Link href="/frota" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                🚌 Frota (FRT)
              </Link>
              <Link href="/manutencao" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                🛠️ Manutenção (MAN)
              </Link>
              <Link href="/abastecimento" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                ⛽ Abastecimento (ABA)
              </Link>
              <Link href="/componentes" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                ⚙️ Componentes (CPN)
              </Link>
              <Link href="/preditivo" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                🧠 Preditivo (PRE)
              </Link>
            </nav>

            {/* Ação de Refresh / Carga Manual Global */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGlobalRefresh}
                disabled={syncing}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-lg shadow-cyan-600/20 border border-cyan-400/30 flex items-center gap-2 transition-all active:scale-95"
                title="Disparar sincronização em tempo real de todos os módulos com o ERP Globus"
              >
                <span className={`text-xs ${syncing ? 'animate-spin' : ''}`}>🔄</span>
                {syncing ? 'Sincronizando...' : 'Carga Manual'}
              </button>

              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-full text-[11px] font-mono text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ETL Globus: <span className="text-white font-bold">{lastSyncText}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal Full-Width */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8">
          {children}
        </main>

        <footer className="border-t border-slate-800/60 py-4 px-8 text-center text-xs text-slate-400 font-mono">
          Jacareí Transporte Urbano LTDA — Sincronização automatizada diária (03:00 AM)
        </footer>

      </body>
    </html>
  );
}
