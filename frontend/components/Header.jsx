'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header({ tabAtiva, setTabAtiva }) {
  const pathname = usePathname();

  const navItems = [
    { id: 'frota', label: '🚍 Frota (FRT)', href: '/frota' },
    { id: 'manutencao', label: '🛠️ Manutenção (MAN)', href: '/manutencao' },
    { id: 'abastecimento', label: '⛽ Abastecimento (ABA)', href: '/abastecimento' },
    { id: 'componentes', label: '⚙️ Componentes (CPN)', href: '/componentes' },
    { id: 'preditivo', label: '🧠 Preditivo (PRE)', href: '/preditivo' },
  ];

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Garagem */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white font-bold rounded-lg w-9 h-9 flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">
          C
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-base tracking-tight">CONECTTAOPS</span>
            <span className="bg-blue-950 text-blue-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-blue-800/60 font-semibold">
              v1.6.0
            </span>
          </div>
          <p className="text-gray-400 text-xs">HUB Operacional — Garagem 002 (JTU Jacareí)</p>
        </div>
      </div>

      {/* Navegação principal por Abas */}
      <nav className="bg-gray-900/90 p-1 rounded-xl border border-gray-800 flex items-center gap-1 shadow-inner">
        {navItems.map((item) => {
          const isActive = tabAtiva ? tabAtiva === item.id : pathname === item.href;

          if (setTabAtiva) {
            return (
              <button
                key={item.id}
                onClick={() => setTabAtiva(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Status da Carga ETL Globus */}
      <div className="flex items-center gap-3">
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer">
          🔄 Carga Manual
        </button>
        <div className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          ETL Globus: <span className="font-bold text-white">03:00 AM OK</span>
        </div>
      </div>
    </header>
  );
}
