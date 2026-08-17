import { useInView } from '../hooks/useInView'

const integrations = [
  { label: 'Bancos & Gateways', angle: 0, color: '#22C55E' },
  { label: 'WhatsApp & Canais', angle: 45, color: '#25D366' },
  { label: 'E-commerce', angle: 90, color: '#818CF8' },
  { label: 'ERPs & Sistemas', angle: 135, color: '#F59E0B' },
  { label: 'Adquirentes', angle: 180, color: '#0EA5E9' },
  { label: 'Mktg & CRM', angle: 225, color: '#EC4899' },
  { label: 'APIs & Webhooks', angle: 270, color: '#8B5CF6' },
  { label: 'Sistemas Legados', angle: 315, color: '#94A3B8' },
]

const attributes = [
  { label: 'API-first', desc: 'Toda a plataforma expõe APIs REST documentadas.' },
  { label: 'Webhooks', desc: 'Eventos em tempo real para sistemas externos.' },
  { label: 'Arquitetura modular', desc: 'Conecte apenas os módulos que sua rede precisa.' },
  { label: 'Dados centralizados', desc: 'Uma única fonte de verdade para toda a operação.' },
]

export default function IntegrationSection() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 lg:py-32 bg-zinc-950 dark-grid relative overflow-hidden" id="integracoes" ref={ref}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 50% at 30% 50%, rgba(79,70,229,0.1) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-block text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-4">Integrações</span>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-5"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Uma arquitetura preparada para conectar sua operação.
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed mb-10">
              Orchestra no centro de um ecossistema conectado. Bancos, gateways, WhatsApp, e-commerce, ERPs, APIs — tudo pode se integrar à plataforma.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {attributes.map((a, i) => (
                <div
                  key={a.label}
                  className="border border-white/[0.06] rounded-xl p-4 bg-white/[0.02]"
                  style={{
                    transition: `opacity 0.5s ${200 + i * 100}ms, transform 0.5s ${200 + i * 100}ms`,
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateY(0)' : 'translateY(12px)',
                  }}
                >
                  <div className="text-sm font-bold text-indigo-400 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{a.label}</div>
                  <div className="text-xs text-zinc-500 leading-relaxed">{a.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`flex items-center justify-center transition-all duration-700 delay-300 ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <div className="relative w-72 h-72 lg:w-80 lg:h-80">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
                {integrations.map((item) => {
                  const rad = (item.angle - 90) * (Math.PI / 180)
                  const r = 120
                  const x2 = 160 + r * Math.cos(rad)
                  const y2 = 160 + r * Math.sin(rad)
                  return (
                    <g key={item.label}>
                      <line
                        x1="160" y1="160"
                        x2={x2} y2={y2}
                        stroke={item.color}
                        strokeWidth="1"
                        strokeOpacity="0.25"
                        strokeDasharray="4 4"
                      />
                      <circle cx={x2} cy={y2} r="4" fill={item.color} fillOpacity="0.5" />
                    </g>
                  )
                })}
                <circle cx="160" cy="160" r="36" fill="#1E1B4B" stroke="#4F46E5" strokeWidth="1.5" />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center z-10">
                  <div className="text-sm font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Orchestra</div>
                  <div className="text-[9px] text-indigo-400">hub central</div>
                </div>
              </div>

              {integrations.map((item) => {
                const rad = (item.angle - 90) * (Math.PI / 180)
                const r = 130
                const x = 160 + r * Math.cos(rad)
                const y = 160 + r * Math.sin(rad)
                const fromCenter = (axis: 'x' | 'y') => {
                  const v = axis === 'x' ? x - 160 : y - 160
                  return v > 0 ? '5px' : v < 0 ? '-5px' : '0'
                }
                return (
                  <div
                    key={item.label}
                    className="absolute text-center"
                    style={{
                      left: `${(x / 320) * 100}%`,
                      top: `${(y / 320) * 100}%`,
                      transform: `translate(-50%, -50%) translate(${fromCenter('x')}, ${fromCenter('y')})`,
                    }}
                  >
                    <div
                      className="bg-zinc-900 border rounded-lg px-2 py-1 whitespace-nowrap"
                      style={{ borderColor: `${item.color}40` }}
                    >
                      <span className="text-[9px] font-medium" style={{ color: item.color }}>{item.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
