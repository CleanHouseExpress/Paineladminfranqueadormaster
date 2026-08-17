import { useInView } from '../hooks/useInView'

export default function CTASection({ onDemo }: { onDemo: () => void }) {
  const { ref, inView } = useInView()

  return (
    <section className="py-28 lg:py-40 bg-zinc-950 relative overflow-hidden" ref={ref}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(79,70,229,0.18) 0%, transparent 65%)',
        }}
      />

      <div className="absolute inset-0 dark-grid opacity-50" />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)' }}
      />

      <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center relative z-10">
        <div
          className={`transition-all duration-800 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300 tracking-wide">Orchestra Tecnologia</span>
          </div>

          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.06] tracking-tight mb-6"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Sua rede pode{' '}
            <span className="gradient-text">operar como uma só.</span>
          </h2>

          <p className="text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto mb-12">
            Conheça a Orchestra e veja como conectar processos, unidades e dados em uma única plataforma.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onDemo}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-150 shadow-lg shadow-indigo-900/40 hover:shadow-indigo-800/50 cursor-pointer"
            >
              Solicitar uma demonstração
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={onDemo}
              className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold px-8 py-4 rounded-xl text-base border border-white/10 transition-all duration-150 cursor-pointer"
            >
              Falar com a Orchestra
            </button>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: 'Multiempresa', label: 'Isolamento total entre redes' },
              { value: 'API-first', label: 'Arquitetura aberta e extensível' },
              { value: 'IA nativa', label: 'Inteligência no núcleo da plataforma' },
            ].map((m) => (
              <div key={m.value} className="text-center">
                <div className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{m.value}</div>
                <div className="text-xs text-zinc-600">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
