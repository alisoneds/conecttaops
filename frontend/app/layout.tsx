import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'CONECTTA OPS - HUB Inteligente ERP Globus',
  description: 'Módulos de Oficina: ABA, CPN, FRT e MAN',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen font-sans antialiased">
        
        {/* Sidebar em Árvore estilo Globus */}
        <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 select-none">
          <div className="space-y-6">
            
            {/* Logo do Sistema */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-cyan-400 tracking-wider">CONECTTA</span>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">OPS</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">Garagem 002 — JTU (Oracle Globus)</p>
            </div>

            {/* Menu em Estrutura de Árvore (Tree-View Globus) */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
                Módulos do Sistema
              </p>

              {/* No Raiz: Oficina */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 font-bold text-sm text-slate-200">
                  <span className="text-slate-400 text-xs">🗂️</span>
                  <span className="w-4 h-4 rounded bg-rose-700 text-white font-serif text-[11px] font-bold flex items-center justify-center shadow-sm">G</span>
                  <span>Oficina</span>
                </div>

                {/* Sub-itens da Árvore */}
                <div className="ml-5 pl-3 border-l-2 border-slate-800 space-y-1">
                  
                  <Link
                    href="/abastecimento"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
                  >
                    <span className="w-3.5 h-3.5 rounded bg-rose-800 text-white font-serif text-[9px] font-bold flex items-center justify-center shrink-0">G</span>
                    <span className="truncate">ABA — Abastecimento</span>
                  </Link>

                  <Link
                    href="/componentes"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
                  >
                    <span className="w-3.5 h-3.5 rounded bg-rose-800 text-white font-serif text-[9px] font-bold flex items-center justify-center shrink-0">G</span>
                    <span className="truncate">CPN — Componentes</span>
                  </Link>

                  <Link
                    href="/frota"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
                  >
                    <span className="w-3.5 h-3.5 rounded bg-rose-800 text-white font-serif text-[9px] font-bold flex items-center justify-center shrink-0">G</span>
                    <span className="truncate">FRT — Frota</span>
                  </Link>

                  <Link
                    href="/manutencao"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
                  >
                    <span className="w-3.5 h-3.5 rounded bg-rose-800 text-white font-serif text-[9px] font-bold flex items-center justify-center shrink-0">G</span>
                    <span className="truncate">MAN — Manutenção</span>
                  </Link>

                </div>
              </div>

              {/* Seção de Governança */}
              <div className="pt-4 border-t border-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1">
                  Governança ETL
                </p>

                <Link
                  href="/governanca"
                  className="flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛡️</span>
                    <span>Auditoria & Sync</span>
                  </div>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">03:00</span>
                </Link>
              </div>

            </div>
          </div>

          {/* Status do Rodapé */}
          <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              GLOBUS ONLINE
            </span>
          </div>
        </aside>

        {/* Área Principal */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
