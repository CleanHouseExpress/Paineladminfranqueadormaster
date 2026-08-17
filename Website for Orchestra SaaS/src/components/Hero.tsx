import { useEffect, useState } from 'react'

const bars = [
  { h: 55, label: 'SP' },
  { h: 72, label: 'RJ' },
  { h: 44, label: 'MG' },
  { h: 88, label: 'RS' },
  { h: 65, label: 'PR' },
  { h: 78, label: 'SC' },
]

const units = [
  { name: 'Unidade São Paulo Centro', status: 'Ativa', color: '#22C55E' },
  { name: 'Unidade Rio de Janeiro Sul', status: 'Em implantação', color: '#F59E0B' },
  { name: 'Unidade Belo Horizonte', status: 'Ativa', color: '#22C55E' },
  { name: 'Unidade Porto Alegre', status: 'Ativa', color: '#22C55E' },
]

const navItems = [
  { icon: 'grid', label: 'Dashboard', active: true },
  { icon: 'ops', label: 'Operações', active: false },
  { icon: 'impl', label: 'Implantação', active: false },
  { icon: 'cat', label: 'Catálogo', active: false },
  { icon: 'fin', label: 'Financeiro', active: false },
  { icon: 'ai', label: 'IA', active: false },
]

function SidebarIcon({ type }: { type: string }) {
  const cls = "w-3.5 h-3.5 text-zinc-400 group-[.active]:text-indigo-400"
  const paths: Record<string, string> = {
    grid: 'M2 2h4v4H2V2zm6 0h4v4H8V2zm6 0h4v4h-4V2zM2 8h4v4H2V8zm6 0h4v4H8V8zm6 0h4v4h-4V8zM2 14h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4z',
    ops: 'M2 12h20M12 2v20M7 7l5-5 5 5M7 17l5 5 5-5',
    impl: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    cat: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z',
    fin: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    ai: 'M12 2a5 5 0 015 5c0 2-1 3.8-2.5 4.8L15 22H9l.5-10.2C8 10.8 7 9 7 7a5 5 0 015-5z',
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[type] || paths.grid} />
    </svg>
  )
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-lg p-2.5 border border-zinc-100">
      <div className="text-[9px] text-zinc-400 mb-0.5">{label}</div>
      <div className="text-base font-bold" style={{ color, fontFamily: 'Manrope, sans-serif' }}>{value}</div>
      <div className="text-[8px] text-zinc-400 mt-0.5">{sub}</div>
    </div>
  )
}

export default function Hero({ onDemo }: { onDemo: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])

  return (
    <section className="relative min-h-screen pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-zinc-50 subtle-grid">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 45% at 72% 50%, rgba(79,70,229,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className={`space-y-7 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-indigo-700 tracking-wide">Plataforma de Gestão para Franquias</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-zinc-950 leading-[1.08] tracking-tight"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Sua rede inteira,{' '}
              <span className="gradient-text">operando em uma</span>{' '}
              única plataforma.
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed max-w-[480px]">
              Centralize operações, implantação, catálogo, estoque, financeiro, comunicação e inteligência em uma plataforma criada para redes de franquias.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onDemo}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all duration-150 shadow-sm hover:shadow-indigo-200 hover:shadow-lg cursor-pointer"
              >
                Solicitar uma demonstração
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold px-6 py-3.5 rounded-xl text-sm border border-zinc-200 transition-all duration-150 cursor-pointer">
                Conhecer a plataforma
              </button>
            </div>

            <div className="flex items-center gap-6 pt-2">
              {[
                { label: 'Multiempresa' },
                { label: 'API-first' },
                { label: 'Multiunidade' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.5 7l3 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          <div
            className={`relative transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ perspective: '1200px' }}
          >
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-200/80 glow-brand"
              style={{ transform: 'rotateY(-6deg) rotateX(3deg)' }}
            >
              <div className="bg-zinc-800 px-3 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 mx-4 bg-zinc-700/60 rounded px-3 py-1 text-[10px] text-zinc-400 text-center">
                  app.orchestra.com.br
                </div>
              </div>

              <div className="flex bg-zinc-950" style={{ height: '380px' }}>
                <div className="w-[140px] flex-shrink-0 bg-zinc-900 border-r border-white/[0.06] flex flex-col p-3 gap-1">
                  <div className="flex items-center gap-1.5 px-1.5 py-2 mb-2">
                    <div className="w-4 h-4">
                      <svg viewBox="0 0 28 28" fill="none" className="w-full h-full">
                        <rect x="2" y="2" width="8" height="8" rx="2" fill="#818CF8" />
                        <rect x="18" y="2" width="8" height="8" rx="2" fill="#818CF8" opacity="0.5" />
                        <rect x="2" y="18" width="8" height="8" rx="2" fill="#818CF8" opacity="0.5" />
                        <rect x="18" y="18" width="8" height="8" rx="2" fill="#818CF8" opacity="0.25" />
                        <line x1="10" y1="6" x2="18" y2="6" stroke="#818CF8" strokeWidth="1.5" />
                        <line x1="6" y1="10" x2="6" y2="18" stroke="#818CF8" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Orchestra</span>
                  </div>

                  {navItems.map((item) => (
                    <div
                      key={item.label}
                      className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer ${item.active ? 'active bg-indigo-600/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <SidebarIcon type={item.icon} />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 bg-zinc-950 p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[10px] text-zinc-500 mb-0.5">Boa tarde, Rafael</div>
                      <div className="text-xs font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Visão da Rede</div>
                    </div>
                    <div className="text-[9px] text-zinc-600 bg-zinc-800 px-2 py-1 rounded">
                      Ago 2025
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <MetricCard label="Unidades ativas" value="247" sub="+12 este mês" color="#818CF8" />
                    <MetricCard label="Implantações" value="18" sub="em andamento" color="#F59E0B" />
                    <MetricCard label="Conformidade" value="94%" sub="+2% vs. mês" color="#22C55E" />
                    <MetricCard label="Pendências" value="3" sub="críticas" color="#EF4444" />
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[9px] font-semibold text-zinc-300">Desempenho por região</div>
                      <div className="text-[8px] text-zinc-600">últimos 30 dias</div>
                    </div>
                    <div className="flex items-end gap-2 h-16">
                      {bars.map((bar, i) => (
                        <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-sm"
                            style={{
                              height: `${bar.h}%`,
                              background: i === 3 ? '#6366F1' : 'rgba(99,102,241,0.35)',
                              animation: mounted ? `barIn 0.6s ${i * 80}ms ease-out forwards` : 'none',
                              transformOrigin: 'bottom',
                              transform: mounted ? 'scaleY(1)' : 'scaleY(0)',
                              transition: `transform 0.5s ${i * 0.08}s ease-out`,
                            }}
                          />
                          <div className="text-[7px] text-zinc-600">{bar.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-2.5">
                    <div className="text-[9px] font-semibold text-zinc-300 mb-2">Últimas unidades</div>
                    <div className="space-y-1.5">
                      {units.map((u) => (
                        <div key={u.name} className="flex items-center justify-between">
                          <span className="text-[8px] text-zinc-400 truncate max-w-[130px]">{u.name}</span>
                          <span className="text-[8px] font-medium flex-shrink-0 ml-2" style={{ color: u.color }}>{u.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white border border-zinc-200 rounded-xl px-3 py-2.5 shadow-lg animate-float" style={{ animationDelay: '1s' }}>
              <div className="text-[10px] font-semibold text-zinc-800 mb-0.5" style={{ fontFamily: 'Manrope, sans-serif' }}>Nova unidade aprovada</div>
              <div className="text-[9px] text-zinc-500">Implantação iniciada automaticamente</div>
            </div>

            <div className="absolute -bottom-3 -left-4 bg-indigo-600 rounded-xl px-3 py-2.5 shadow-lg animate-float" style={{ animationDelay: '2s' }}>
              <div className="text-[10px] font-semibold text-white mb-0.5" style={{ fontFamily: 'Manrope, sans-serif' }}>IA identificou risco</div>
              <div className="text-[9px] text-indigo-200">3 unidades com estoque crítico</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
