import { useState, useEffect } from 'react'
import { useInView } from '../hooks/useInView'

const queries = [
  {
    q: 'Quais unidades têm pendências críticas esta semana?',
    answer: '3 unidades identificadas com pendências críticas.',
    details: [
      { unit: 'SP-47', issue: 'Estoque abaixo do mínimo', color: '#EF4444' },
      { unit: 'RJ-03', issue: 'Relatório financeiro atrasado', color: '#F59E0B' },
      { unit: 'MG-07', issue: 'Documentação incompleta', color: '#F59E0B' },
    ],
  },
  {
    q: 'Resuma os principais riscos das implantações em andamento.',
    answer: '18 implantações ativas. 2 com risco alto de atraso.',
    details: [
      { unit: 'Unidade RS-12', issue: 'Prazo de treinamento em risco', color: '#EF4444' },
      { unit: 'Unidade BA-05', issue: 'Documentação pendente há 8 dias', color: '#F59E0B' },
    ],
  },
  {
    q: 'Quais produtos tiveram maior queda de estoque?',
    answer: 'Detectada queda significativa em 4 produtos nas últimas 72h.',
    details: [
      { unit: 'Embalagem Premium P', issue: '-62% vs. semana anterior', color: '#EF4444' },
      { unit: 'Insumo Base A', issue: '-44% — reposição recomendada', color: '#F59E0B' },
    ],
  },
]

export default function AISection() {
  const { ref, inView } = useInView()
  const [activeQuery, setActiveQuery] = useState(0)
  const [typing, setTyping] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    if (!inView) return
    setShowAnswer(false)
    setTyping(true)
    const t1 = setTimeout(() => { setTyping(false); setShowAnswer(true) }, 1200)
    return () => clearTimeout(t1)
  }, [activeQuery, inView])

  useEffect(() => {
    if (!inView) return
    const interval = setInterval(() => {
      setActiveQuery((prev) => (prev + 1) % queries.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [inView])

  const current = queries[activeQuery]

  return (
    <section className="py-24 lg:py-32 bg-zinc-950 dark-grid relative overflow-hidden" id="ia" ref={ref}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 60% 50%, rgba(79,70,229,0.14) 0%, transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
        <div
          className={`text-center mb-14 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-300 tracking-wide">Inteligência Artificial</span>
          </div>
          <h2
            className="text-3xl lg:text-5xl font-extrabold text-white leading-tight max-w-2xl mx-auto mb-5"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            IA que entende a operação da sua rede.
          </h2>
          <p className="text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            A Orchestra está sendo preparada para agentes inteligentes capazes de acompanhar informações, processos e interações dentro do contexto real da operação.
          </p>
        </div>

        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-start transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div>
            <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-4">Exemplos de consultas</div>
            <div className="space-y-2 mb-8">
              {queries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setActiveQuery(i)}
                  className={`w-full text-left p-4 rounded-xl border text-sm transition-all duration-200 cursor-pointer ${
                    activeQuery === i
                      ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.12]'
                  }`}
                >
                  <span className="text-indigo-600 mr-2">"</span>
                  {q.q}
                  <span className="text-indigo-600 ml-1">"</span>
                </button>
              ))}
            </div>

            <div className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.02]">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">A IA está integrada à plataforma</div>
              <div className="space-y-2.5">
                {[
                  'Acessa dados reais da sua operação',
                  'Entende contexto de cada unidade',
                  'Responde com estrutura, não apenas texto',
                  'Pode sugerir ações e alertas automáticos',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span className="text-xs text-zinc-400">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600/20 border border-indigo-600/30 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="2" y="2" width="4" height="4" rx="0.5" />
                    <rect x="8" y="2" width="4" height="4" rx="0.5" />
                    <rect x="2" y="8" width="4" height="4" rx="0.5" />
                    <rect x="8" y="8" width="4" height="4" rx="0.5" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-zinc-300" style={{ fontFamily: 'Manrope, sans-serif' }}>Orchestra IA</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-zinc-600">Em desenvolvimento</span>
                </div>
              </div>

              <div className="p-5 space-y-4 min-h-[280px]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] text-zinc-400">Você</span>
                  </div>
                  <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-zinc-200 leading-relaxed">{current.q}</p>
                  </div>
                </div>

                {(typing || showAnswer) && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 flex-shrink-0">
                      <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="1" y="1" width="4" height="4" rx="0.5" />
                        <rect x="7" y="1" width="4" height="4" rx="0.5" />
                        <rect x="1" y="7" width="4" height="4" rx="0.5" />
                        <rect x="7" y="7" width="4" height="4" rx="0.5" />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-3">
                      {typing ? (
                        <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 inline-flex items-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-zinc-500"
                              style={{ animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }}
                            />
                          ))}
                        </div>
                      ) : showAnswer && (
                        <>
                          <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                            <p className="text-sm text-zinc-200 leading-relaxed">{current.answer}</p>
                          </div>
                          <div className="space-y-2">
                            {current.details.map((d) => (
                              <div key={d.unit} className="bg-zinc-800/60 border border-white/[0.05] rounded-xl px-3 py-2.5 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                <div>
                                  <div className="text-[11px] font-semibold text-zinc-200">{d.unit}</div>
                                  <div className="text-[10px] text-zinc-500">{d.issue}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-3 border border-white/[0.06]">
                  <span className="text-sm text-zinc-600 flex-1">Faça uma pergunta sobre a operação...</span>
                  <div className="w-6 h-6 bg-indigo-600/30 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
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
