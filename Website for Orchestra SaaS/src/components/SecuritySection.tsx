import { useInView } from '../hooks/useInView'

const features = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V5l7-3z" />
      </svg>
    ),
    title: 'Isolamento entre redes',
    desc: 'Cada rede opera em um espaço completamente isolado das demais.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="8" r="4" />
        <path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" />
        <path d="M14 2l2 2-5 5" />
      </svg>
    ),
    title: 'Controle de acesso',
    desc: 'Permissões granulares por módulo, função e nível hierárquico.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h12v3l-4 3v5H8v-5L4 7V4z" />
      </svg>
    ),
    title: 'Auditoria completa',
    desc: 'Registro de todas as ações e alterações na plataforma.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10a7 7 0 0114 0" />
        <path d="M10 3v7l4 2" />
      </svg>
    ),
    title: 'Disponibilidade',
    desc: 'Arquitetura preparada para operações contínuas e críticas.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="12" height="16" rx="2" />
        <path d="M8 7h4M8 10h4M8 13h2" />
      </svg>
    ),
    title: 'APIs documentadas',
    desc: 'Integração segura com autenticação e controle de escopo.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12l6-6 4 4 6-6" />
        <path d="M14 4h4v4" />
      </svg>
    ),
    title: 'Escalabilidade',
    desc: 'Projetado para crescer junto com a rede, de dezenas a milhares de unidades.',
  },
]

export default function SecuritySection() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 lg:py-32 bg-zinc-50 subtle-grid" ref={ref}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div
          className={`text-center mb-14 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <span className="inline-block text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-4">Arquitetura</span>
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-zinc-950 mb-4"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Tecnologia preparada para operações críticas.
          </h2>
          <p className="text-base text-zinc-500 max-w-xl mx-auto">
            Arquitetura pensada com segurança e isolamento de dados desde a base.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card-hover bg-white border border-zinc-200 rounded-2xl p-6"
              style={{
                transition: `opacity 0.5s ${i * 80}ms, transform 0.5s ${i * 80}ms`,
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(16px)',
              }}
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {f.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
