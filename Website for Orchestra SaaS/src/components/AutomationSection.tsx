import { useInView } from '../hooks/useInView'

const steps = [
  { id: 1, label: 'Nova unidade criada', type: 'trigger', color: '#4F46E5', icon: '⚡' },
  { id: 2, label: 'Aguardar aprovação', type: 'wait', color: '#F59E0B', icon: '⏳' },
  { id: 3, label: 'Criar tarefas de implantação', type: 'action', color: '#22C55E', icon: '✓' },
  { id: 4, label: 'Notificar responsáveis', type: 'action', color: '#22C55E', icon: '🔔' },
  { id: 5, label: 'Solicitar documentos', type: 'action', color: '#22C55E', icon: '📄' },
  { id: 6, label: 'Acompanhar pendências', type: 'monitor', color: '#0EA5E9', icon: '◉' },
  { id: 7, label: 'IA analisa riscos', type: 'ai', color: '#818CF8', icon: '◈' },
]

const benefits = [
  { title: 'Trigger baseado em eventos', desc: 'Qualquer evento da plataforma pode iniciar uma automação.' },
  { title: 'Ações encadeadas', desc: 'Cada etapa pode disparar múltiplas ações em paralelo ou sequência.' },
  { title: 'IA integrada ao fluxo', desc: 'Agentes de IA podem analisar, decidir e agir dentro de automações.' },
  { title: 'Sem código', desc: 'Builder visual que qualquer gestor consegue configurar.' },
]

export default function AutomationSection() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 lg:py-32 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-block text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-4">Automação</span>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-zinc-950 leading-tight mb-5"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Da informação à ação.
            </h2>
            <p className="text-base text-zinc-500 leading-relaxed mb-8">
              Crie automações visuais que conectam eventos da plataforma a ações concretas — sem código, com IA integrada ao fluxo.
            </p>

            <div className="space-y-4">
              {benefits.map((b, i) => (
                <div
                  key={b.title}
                  className="flex items-start gap-3"
                  style={{
                    transition: `opacity 0.5s ${200 + i * 100}ms`,
                    opacity: inView ? 1 : 0,
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-800" style={{ fontFamily: 'Manrope, sans-serif' }}>{b.title}</div>
                    <div className="text-sm text-zinc-500">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`transition-all duration-700 delay-300 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-zinc-200">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-sm font-bold text-zinc-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Automação: Abertura de nova unidade
                </span>
                <div className="ml-auto px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">
                  <span className="text-[10px] font-semibold text-emerald-600">Ativa</span>
                </div>
              </div>

              <div className="space-y-1">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex flex-col items-start">
                    <div
                      className="flex items-center gap-3 w-full p-3 rounded-xl border transition-all duration-200 hover:shadow-sm"
                      style={{
                        borderColor: `${step.color}25`,
                        backgroundColor: `${step.color}08`,
                        transition: `opacity 0.5s ${i * 80}ms, transform 0.5s ${i * 80}ms`,
                        opacity: inView ? 1 : 0,
                        transform: inView ? 'translateX(0)' : 'translateX(-8px)',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-bold"
                        style={{ backgroundColor: `${step.color}20`, color: step.color }}
                      >
                        {step.id}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-zinc-700">{step.label}</span>
                      </div>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                        style={{ color: step.color, backgroundColor: `${step.color}15` }}
                      >
                        {step.type}
                      </span>
                    </div>

                    {i < steps.length - 1 && (
                      <div className="ml-[22px] flex flex-col items-center">
                        <div className="w-px h-2 bg-zinc-200" />
                        <svg className="w-2.5 h-2 text-zinc-300" viewBox="0 0 10 8" fill="currentColor">
                          <path d="M5 8L0 0h10L5 8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
