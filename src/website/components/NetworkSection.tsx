import { useInView } from '../hooks/useInView'

const levels = [
  {
    label: 'Franqueadora',
    desc: 'Governança central, visão consolidada e controle da rede',
    color: '#4F46E5',
    bg: 'bg-indigo-600',
    width: 'max-w-xs',
  },
  {
    label: 'Regiões',
    desc: 'Coordenação por área geográfica ou segmento',
    color: '#818CF8',
    bg: 'bg-indigo-400',
    width: 'max-w-lg',
  },
  {
    label: 'Unidades',
    desc: 'Cada franqueado com acesso ao seu contexto operacional',
    color: '#A5B4FC',
    bg: 'bg-indigo-300',
    width: 'max-w-xl',
  },
  {
    label: 'Operações',
    desc: 'Processos, rotinas, estoque, atendimento e financeiro no nível da unidade',
    color: '#C7D2FE',
    bg: 'bg-indigo-200',
    width: 'max-w-2xl',
  },
  {
    label: 'Clientes',
    desc: 'A experiência final, conectada a toda a cadeia acima',
    color: '#E0E7FF',
    bg: 'bg-indigo-100',
    width: 'max-w-3xl',
  },
]

const highlights = [
  'Multiempresa',
  'Multiunidade',
  'Permissões granulares',
  'Governança centralizada',
  'Personalização por unidade',
  'Operações contextuais',
]

export default function NetworkSection() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 lg:py-32 bg-zinc-950 dark-grid relative overflow-hidden" id="rede" ref={ref}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(79,70,229,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-block text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-4">Visão de rede</span>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-6"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Da franqueadora à ponta da operação.
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed mb-8">
              A Orchestra entende diferentes níveis de gestão. A franqueadora mantém governança e visão centralizada enquanto cada unidade acessa apenas o que faz parte da sua operação.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {highlights.map((h, i) => (
                <div
                  key={h}
                  className="flex items-center gap-2"
                  style={{
                    transition: `opacity 0.4s ${400 + i * 80}ms`,
                    opacity: inView ? 1 : 0,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  <span className="text-sm text-zinc-400">{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`flex flex-col items-center gap-0 transition-all duration-700 delay-300 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            {levels.map((level, i) => (
              <div key={level.label} className="flex flex-col items-center w-full">
                <div
                  className={`w-full ${level.width} mx-auto`}
                  style={{
                    transition: `opacity 0.5s ${300 + i * 120}ms, transform 0.5s ${300 + i * 120}ms`,
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'scaleX(1)' : 'scaleX(0.6)',
                  }}
                >
                  <div
                    className="border rounded-xl p-4 text-center"
                    style={{
                      borderColor: `${level.color}30`,
                      backgroundColor: `${level.color}0f`,
                    }}
                  >
                    <div
                      className="text-sm font-bold mb-1"
                      style={{ color: level.color, fontFamily: 'Manrope, sans-serif' }}
                    >
                      {level.label}
                    </div>
                    <div className="text-xs text-zinc-500">{level.desc}</div>
                  </div>
                </div>

                {i < levels.length - 1 && (
                  <div className="flex flex-col items-center py-1" style={{ opacity: inView ? 1 : 0, transition: `opacity 0.5s ${500 + i * 100}ms` }}>
                    <div className="w-px h-4 bg-indigo-800" />
                    <svg className="w-3 h-3 text-indigo-700" viewBox="0 0 12 8" fill="currentColor">
                      <path d="M6 8L0 0h12L6 8z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
