import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded bg-rose-700 text-white font-serif text-sm font-bold flex items-center justify-center shadow">G</span>
          <h1 className="text-3xl font-extrabold text-white">HUB Operacional de Oficina (ERP Globus)</h1>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Painel Integrado da Garagem 002 — JTU. Dados sincronizados diariamente às 03:00 AM (>= 01/01/2026).
        </p>
      </header>

      {/* Grade dos 4 Módulos do Print */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link href="/abastecimento" className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl transition-all group shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="w-8 h-8 rounded-lg bg-rose-900/60 border border-rose-700/50 text-white font-serif font-bold text-sm flex items-center justify-center">G</span>
            <span className="text-2xl">⛽</span>
          </div>
          <h2 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">ABA — Abastecimento</h2>
          <p className="text-xs text-slate-400 mt-2">Consumo acumulado (L), médias Km/L e ranking de discrepâncias por veículo.</p>
        </Link>

        <Link href="/componentes" className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl transition-all group shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="w-8 h-8 rounded-lg bg-rose-900/60 border border-rose-700/50 text-white font-serif font-bold text-sm flex items-center justify-center">G</span>
            <span className="text-2xl">⚙️</span>
          </div>
          <h2 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">CPN — Componentes</h2>
          <p className="text-xs text-slate-400 mt-2">Gestão diretiva de agregados: pneus, baterias, motores e caixas de câmbio.</p>
        </Link>

        <Link href="/frota" className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl transition-all group shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="w-8 h-8 rounded-lg bg-rose-900/60 border border-rose-700/50 text-white font-serif font-bold text-sm flex items-center justify-center">G</span>
            <span className="text-2xl">🚌</span>
          </div>
          <h2 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">FRT — Frota</h2>
          <p className="text-xs text-slate-400 mt-2">Inventário cadastral, idade formatada (anos e meses) e Raio-X 360º por ônibus.</p>
        </Link>

        <Link href="/manutencao" className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl transition-all group shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="w-8 h-8 rounded-lg bg-rose-900/60 border border-rose-700/50 text-white font-serif font-bold text-sm flex items-center justify-center">G</span>
            <span className="text-2xl">🔧</span>
          </div>
          <h2 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">MAN — Manutenção</h2>
          <p className="text-xs text-slate-400 mt-2">OSs PENDENTES (abertas/em execução) e histórico de intervenções de oficina.</p>
        </Link>

      </div>
    </main>
  );
}
