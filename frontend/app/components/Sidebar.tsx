'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const modules = [
  {
    name: 'Gestão de Frota',
    href: '/frota',
    icon: '🚌',
    badge: 'Módulo 1',
  },
  {
    name: 'Manutenção & OS',
    href: '/manutencao',
    icon: '🔧',
    badge: 'Módulo 2',
  },
  {
    name: 'Abastecimento',
    href: '/abastecimento',
    icon: '⛽',
    badge: 'Módulo 3',
  },
  {
    name: 'Governança & Sync',
    href: '/governanca',
    icon: '🛡️',
    badge: 'Módulo 4',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div className="p-5 space-y-6">
        <div>
          <Link href="/frota" className="flex items-center gap-2">
            <span className="text-2xl font-black text-cyan-400 tracking-wider">CONECTTA</span>
            <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-mono font-bold">OPS</span>
          </Link>
          <p className="text-xs text-slate-500 mt-1">HUB Operacional — Garagem 002 JTU</p>
        </div>

        <nav className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Módulos do Sistema</p>
          {modules.map((mod) => {
            const isActive = pathname.startsWith(mod.href);
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{mod.icon}</span>
                  <span>{mod.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-500'
                }`}>
                  {mod.badge}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-slate-400">ENGINE ONLINE (v1.3)</span>
        </div>
      </div>
    </aside>
  );
}
