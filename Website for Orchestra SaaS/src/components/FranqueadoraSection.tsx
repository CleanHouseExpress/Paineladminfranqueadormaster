import { useInView } from '../hooks/useInView'

const valuePoints = [
  { title: 'Visão consolidada', desc: 'Toda a rede em um único painel executivo.' },
  { title: 'Padronização', desc: 'Processos e regras aplicados de forma consistente.' },
  { title: 'Governança', desc: 'Controle de permissões e acesso por nível.' },
  { title: 'Decisões orientadas por dados', desc: 'Indicadores em tempo real de cada unidade.' },
]

export default function FranqueadoraSection() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 lg:py-32 bg-white" id="franqueadoras" ref={ref}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <span className="inline-block text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-4">Para a franqueadora</span>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-zinc-950 leading-tight mb-5"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Controle central sem perder a realidade de cada unidade.
            </h2>
            <p className="text-base text-zinc-500 leading-relaxed mb-8">
              A franqueadora tem acesso a uma visão executiva completa: unidades ativas, implantações em andamento, indicadores financeiros, conformidade e muito mais — tudo em um único lugar.
            </p>

            <div className="space-y-4">
              {valuePoints.map((p, i) => (
                <div
                  key={p.title}
                  className="flex items-start gap-3"
                  style={{
                    transition: `opacity 0.5s ${200 + i * 100}ms, transform 0.5s ${200 + i * 100}ms`,
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateX(0)' : 'translateX(-12px)',
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-800" style={{ fontFamily: 'Manrope, sans-serif' }}>{p.title}</div>
                    <div className="text-sm text-zinc-500">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`transition-all duration-700 delay-300 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            <div className="bg-zinc-950 rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl">
              <div className="bg-zinc-900 px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <div className="text-[11px] text-zinc-500 font-medium">Painel Executivo — Franqueadora</div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Unidades ativas', value: '247', color: '#818CF8' },
                    { label: 'Em implantação', value: '18', color: '#F59E0B' },
                    { label: 'Alertas', value: '3', color: '#EF4444' },
                  ].map((m) => (
                    <div key={m.label} className="bg-zinc-900 rounded-xl p-3.5">
                      <div className="text-[9px] text-zinc-500 mb-1">{m.label}</div>
                      <div className="text-xl font-extrabold" style={{ color: m.color, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-900 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-300" style={{ fontFamily: 'Manrope, sans-serif' }}>Conformidade por região</span>
                    <span className="text-[10px] text-zinc-600">últimos 30 dias</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { region: 'São Paulo', pct: 96 },
                      { region: 'Rio de Janeiro', pct: 91 },
                      { region: 'Sul', pct: 98 },
                      { region: 'Centro-Oeste', pct: 88 },
                    ].map((r) => (
                      <div key={r.region} className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 w-24 flex-shrink-0">{r.region}</span>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${r.pct}%`,
                              background: r.pct >= 95 ? '#4ADE80' : r.pct >= 90 ? '#818CF8' : '#F59E0B',
                              transition: 'width 0.8s ease-out',
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-300 w-8 text-right">{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4">
                  <div className="text-xs font-semibold text-zinc-300 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>Pendências críticas</div>
                  <div className="space-y-2">
                    {[
                      { unit: 'Unidade SP-47', issue: 'Estoque abaixo do mínimo', severity: 'Alta' },
                      { unit: 'Unidade RJ-12', issue: 'Relatório financeiro atrasado', severity: 'Média' },
                      { unit: 'Unidade MG-03', issue: 'Documentação incompleta', severity: 'Baixa' },
                    ].map((r) => (
                      <div key={r.unit} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                        <div>
                          <div className="text-[10px] font-semibold text-zinc-300">{r.unit}</div>
                          <div className="text-[9px] text-zinc-600">{r.issue}</div>
                        </div>
                        <span
                          className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: r.severity === 'Alta' ? 'rgba(239,68,68,0.15)' : r.severity === 'Média' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.2)',
                            color: r.severity === 'Alta' ? '#FCA5A5' : r.severity === 'Média' ? '#FCD34D' : '#94A3B8',
                          }}
                        >
                          {r.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
