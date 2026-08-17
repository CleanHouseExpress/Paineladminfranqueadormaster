import { useInView } from '../hooks/useInView'

const scattered = [
  { label: 'Planilhas', x: '5%', y: '15%', delay: 0 },
  { label: 'WhatsApp', x: '20%', y: '5%', delay: 80 },
  { label: 'ERP legado', x: '58%', y: '8%', delay: 160 },
  { label: 'Financeiro', x: '75%', y: '20%', delay: 100 },
  { label: 'Controle de estoque', x: '82%', y: '55%', delay: 200 },
  { label: 'CRM', x: '70%', y: '78%', delay: 140 },
  { label: 'E-mail', x: '42%', y: '85%', delay: 60 },
  { label: 'Relatórios', x: '12%', y: '72%', delay: 180 },
  { label: 'Sistema A', x: '2%', y: '45%', delay: 220 },
  { label: 'Mktg', x: '35%', y: '2%', delay: 120 },
]

const problems = [
  'Informações duplicadas em múltiplos sistemas',
  'Visibilidade nula da operação em tempo real',
  'Processos diferentes em cada unidade',
  'Implantação despadronizada e lenta',
  'Controles financeiros isolados e manuais',
  'Dados espalhados, decisões no escuro',
]

export default function ProblemSection() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 lg:py-32 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-16">
          <div
            className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <span className="inline-block text-xs font-semibold text-red-500 tracking-widest uppercase mb-4">O problema</span>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-zinc-950 leading-tight max-w-2xl mx-auto"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Sua rede não deveria depender de dezenas de sistemas desconectados.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div
            className={`relative h-64 lg:h-80 transition-all duration-700 delay-200 ${inView ? 'opacity-100' : 'opacity-0'}`}
          >
            {scattered.map((item) => (
              <div
                key={item.label}
                className="absolute"
                style={{
                  left: item.x,
                  top: item.y,
                  transition: `opacity 0.5s ${item.delay}ms, transform 0.5s ${item.delay}ms`,
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'scale(1)' : 'scale(0.8)',
                }}
              >
                <div className="bg-white border border-red-100 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <span className="text-[11px] font-medium text-zinc-500">{item.label}</span>
                </div>
              </div>
            ))}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 320">
                <line x1="80" y1="50" x2="200" y2="160" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="320" y1="40" x2="200" y2="160" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="350" y1="200" x2="200" y2="160" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="100" y1="250" x2="200" y2="160" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="20" y1="160" x2="200" y2="160" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="240" y1="20" x2="200" y2="160" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" />
              </svg>
            </div>
          </div>

          <div
            className={`space-y-8 transition-all duration-700 delay-300 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
          >
            <ul className="space-y-3.5">
              {problems.map((p, i) => (
                <li
                  key={p}
                  className="flex items-start gap-3"
                  style={{
                    transition: `opacity 0.5s ${300 + i * 80}ms, transform 0.5s ${300 + i * 80}ms`,
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateX(0)' : 'translateX(12px)',
                  }}
                >
                  <div className="w-5 h-5 rounded-full border border-red-200 bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-red-400" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 2l6 6M8 2L2 8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-600">{p}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-zinc-100 pt-6">
              <div className="flex items-start gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 5v3l2 2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-indigo-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    A Orchestra transforma processos fragmentados em uma operação conectada.
                  </div>
                  <div className="text-xs text-indigo-600">
                    Uma plataforma para toda a rede.
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
