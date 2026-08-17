import { useInView } from '../hooks/useInView'

const features = [
  'Acesse processos e rotinas da unidade',
  'Realize pedidos e consulte o catálogo',
  'Acompanhe a implantação passo a passo',
  'Gerencie estoque e movimentações',
  'Visualize indicadores da unidade',
  'Receba comunicados da franqueadora',
  'Acompanhe o financeiro da unidade',
  'Use ferramentas específicas do seu contexto',
]

export default function FranqueadoSection() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 lg:py-32 bg-zinc-50 subtle-grid" id="franqueados" ref={ref}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div
            className={`relative transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
          >
            <div className="bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-xl">
              <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="1" y="1" width="4" height="4" rx="0.5" />
                      <rect x="7" y="1" width="4" height="4" rx="0.5" />
                      <rect x="1" y="7" width="4" height="4" rx="0.5" />
                      <rect x="7" y="7" width="4" height="4" rx="0.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Orchestra</div>
                    <div className="text-[8px] text-indigo-200">Unidade São Paulo Centro</div>
                  </div>
                </div>
                <div className="text-[9px] text-indigo-200">Franqueado: Carlos M.</div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Vendas hoje', value: 'R$ 4.280', color: '#22C55E', icon: '↑' },
                    { label: 'Pedidos', value: '23', color: '#818CF8', icon: '●' },
                    { label: 'Estoque OK', value: '87%', color: '#F59E0B', icon: '◉' },
                  ].map((m) => (
                    <div key={m.label} className="bg-zinc-50 rounded-lg p-2.5 text-center">
                      <div className="text-[8px] text-zinc-500 mb-1">{m.label}</div>
                      <div className="text-sm font-bold" style={{ color: m.color, fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-zinc-700 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Tarefas de hoje</div>
                  <div className="space-y-1.5">
                    {[
                      { task: 'Conferir abertura de caixa', done: true },
                      { task: 'Registrar entrada de estoque', done: true },
                      { task: 'Enviar relatório diário', done: false },
                      { task: 'Treinamento módulo financeiro', done: false },
                    ].map((t) => (
                      <div key={t.task} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-300'}`}>
                          {t.done && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M2 5l2.5 2.5 4-4" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[10px] ${t.done ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>{t.task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-indigo-600" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M6 1L2 4v6h8V4L6 1z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-indigo-800 mb-0.5">Comunicado da franqueadora</div>
                      <div className="text-[9px] text-indigo-600">Novo catálogo de inverno disponível. Confira os produtos atualizados.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            <span className="inline-block text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-4">Para o franqueado</span>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-zinc-950 leading-tight mb-5"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Uma experiência simples para quem está na operação.
            </h2>
            <p className="text-base text-zinc-500 leading-relaxed mb-8">
              O mesmo ecossistema oferece uma experiência focada no contexto de cada unidade. O franqueado acessa apenas o que é relevante para o seu dia a dia.
            </p>

            <div className="grid grid-cols-1 gap-2">
              {features.map((f, i) => (
                <div
                  key={f}
                  className="flex items-center gap-2.5"
                  style={{
                    transition: `opacity 0.4s ${200 + i * 60}ms`,
                    opacity: inView ? 1 : 0,
                  }}
                >
                  <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-indigo-500" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 5l2.5 2.5L8 2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-600">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
