import { useInView } from '../hooks/useInView'

const modules = [
  {
    id: 'ops',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="16" height="14" rx="2" />
        <path d="M6 7h8M6 10h5M6 13h3" />
      </svg>
    ),
    name: 'Operações',
    description: 'Centralize rotinas, processos, indicadores e acompanhamento das unidades em tempo real.',
    accent: '#4F46E5',
    preview: (
      <div className="space-y-1.5">
        {['Abertura de Loja SP', 'Auditoria RJ', 'Rotina Diária MG'].map((t, i) => (
          <div key={t} className="flex items-center gap-2 bg-zinc-50 rounded px-2 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#22C55E' : i === 1 ? '#F59E0B' : '#818CF8' }} />
            <span className="text-[10px] text-zinc-600">{t}</span>
            <div className="ml-auto text-[9px] text-zinc-400">{i === 0 ? '100%' : i === 1 ? '67%' : '45%'}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'impl',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L4 6v8l6 4 6-4V6l-6-4z" />
        <path d="M10 2v14M4 6l6 4 6-4" />
      </svg>
    ),
    name: 'Implantação',
    description: 'Estruture jornadas completas para abertura e implantação de novas unidades.',
    accent: '#0EA5E9',
    preview: (
      <div className="flex flex-col gap-1">
        {['Documentação', 'Treinamento', 'Infraestrutura', 'Go-live'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${i < 2 ? 'bg-sky-100 text-sky-600' : 'bg-zinc-100 text-zinc-400'}`}>
              {i < 2 ? '✓' : i + 1}
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-sky-400" style={{ width: `${[100, 100, 40, 0][i]}%` }} />
            </div>
            <span className="text-[9px] text-zinc-400">{s}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'cat',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v3H3V5zM3 8v7a2 2 0 002 2h10a2 2 0 002-2V8H3z" />
        <circle cx="7" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    name: 'Catálogo',
    description: 'Gerencie produtos, serviços, fornecedores, preços e disponibilidade para toda a rede.',
    accent: '#8B5CF6',
    preview: (
      <div className="grid grid-cols-3 gap-1.5">
        {['Produto A', 'Produto B', 'Produto C', 'Produto D', 'Produto E', 'Produto F'].map((p) => (
          <div key={p} className="bg-zinc-50 rounded p-1.5 text-center">
            <div className="w-6 h-6 bg-violet-100 rounded mx-auto mb-1" />
            <div className="text-[8px] text-zinc-500">{p}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'stock',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l7-7 7 7M5 7v10h10V7" />
        <rect x="8" y="12" width="4" height="5" />
      </svg>
    ),
    name: 'Estoque',
    description: 'Controle movimentações, disponibilidade, inventários e operações de estoque.',
    accent: '#10B981',
    preview: (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-1">
          <span>Item</span><span>Disp.</span><span>Mín.</span><span>Status</span>
        </div>
        {[
          { name: 'Embalagem P', disp: 1240, min: 200, ok: true },
          { name: 'Insumo A', disp: 85, min: 150, ok: false },
          { name: 'Produto X', disp: 560, min: 100, ok: true },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between text-[9px]">
            <span className="text-zinc-600 w-20 truncate">{r.name}</span>
            <span className="text-zinc-700 font-medium">{r.disp}</span>
            <span className="text-zinc-400">{r.min}</span>
            <span className={`font-medium ${r.ok ? 'text-emerald-500' : 'text-red-500'}`}>{r.ok ? 'OK' : 'Baixo'}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'fin',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v8M7.5 7.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3H13" />
      </svg>
    ),
    name: 'Financeiro',
    description: 'Base financeira integrada para vendas, pagamentos, fluxo de caixa e integrações contábeis.',
    accent: '#F59E0B',
    preview: (
      <div className="space-y-2">
        {[
          { label: 'Receita do mês', value: 'R$ 2,4M', change: '+8%', up: true },
          { label: 'Cobranças pendentes', value: 'R$ 147K', change: '-3 hoje', up: false },
          { label: 'Royalties a receber', value: 'R$ 386K', change: 'no prazo', up: true },
        ].map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-[9px] text-zinc-500">{m.label}</span>
            <div className="text-right">
              <div className="text-[10px] font-bold text-zinc-800">{m.value}</div>
              <div className={`text-[8px] ${m.up ? 'text-emerald-500' : 'text-red-400'}`}>{m.change}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'comm',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10c0 4-3.6 7-8 7a8.8 8.8 0 01-3.8-.86L2 18l1.86-4.2A7 7 0 1118 10z" />
      </svg>
    ),
    name: 'Comunicação',
    description: 'Conecte canais, atendimento, campanhas e relacionamento com unidades e clientes finais.',
    accent: '#EC4899',
    preview: (
      <div className="space-y-1.5">
        <div className="bg-zinc-50 rounded p-2">
          <div className="text-[9px] font-semibold text-zinc-700 mb-1">Comunicado às unidades</div>
          <div className="text-[8px] text-zinc-500">Atualização do catálogo de inverno disponível...</div>
          <div className="text-[8px] text-pink-500 mt-1">247 unidades • lido por 89%</div>
        </div>
        <div className="bg-zinc-50 rounded p-2">
          <div className="text-[9px] font-semibold text-zinc-700 mb-1">Campanha Regional SP</div>
          <div className="text-[8px] text-zinc-500">Disparada para 38 unidades da região</div>
        </div>
      </div>
    ),
  },
  {
    id: 'ai',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="12" height="12" rx="2" />
        <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
        <path d="M7 13c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5" />
      </svg>
    ),
    name: 'Inteligência Artificial',
    description: 'Agentes de IA que acompanham processos, interpretam dados e apoiam decisões da rede.',
    accent: '#4F46E5',
    preview: (
      <div className="space-y-1.5">
        <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100">
          <div className="text-[9px] text-indigo-600 font-medium mb-1">Consulta</div>
          <div className="text-[9px] text-zinc-700">Quais unidades têm pendências críticas esta semana?</div>
        </div>
        <div className="bg-zinc-50 rounded-lg p-2">
          <div className="text-[9px] text-zinc-500 mb-1">Resposta • 3 unidades identificadas</div>
          <div className="text-[9px] text-zinc-700">SP-14, RJ-03 e MG-07 possuem irregularidades financeiras e de estoque.</div>
        </div>
      </div>
    ),
  },
  {
    id: 'expand',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17L10 3l7 14H3z" />
        <path d="M10 9v4M10 14h.01" />
      </svg>
    ),
    name: 'Expansão',
    description: 'Organize processos de crescimento, prospecção e abertura de novas unidades da rede.',
    accent: '#14B8A6',
    preview: (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-500">Leads qualificados</span>
          <span className="text-[10px] font-bold text-teal-600">24</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-500">Em negociação</span>
          <span className="text-[10px] font-bold text-amber-500">8</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-500">Contratos assinados</span>
          <span className="text-[10px] font-bold text-emerald-600">3</span>
        </div>
        <div className="w-full h-1 rounded-full bg-zinc-100 overflow-hidden mt-1">
          <div className="h-full rounded-full bg-teal-400" style={{ width: '65%' }} />
        </div>
      </div>
    ),
  },
]

export default function PlatformModules() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 lg:py-32 bg-zinc-50 subtle-grid" id="plataforma" ref={ref}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div
          className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <span className="inline-block text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-4">A plataforma</span>
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-zinc-950 mb-4"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Uma plataforma. Diversas áreas da rede.
          </h2>
          <p className="text-base text-zinc-500 max-w-xl mx-auto">
            Cada módulo foi pensado para uma área específica da operação, mas todos compartilham dados dentro de uma única arquitetura.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((mod, i) => (
            <div
              key={mod.id}
              className="module-card bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-4 cursor-default"
              style={{
                transition: `opacity 0.5s ${i * 60}ms, transform 0.5s ${i * 60}ms, box-shadow 0.2s, border-color 0.2s`,
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(16px)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="module-icon w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{ backgroundColor: `${mod.accent}14`, color: mod.accent }}
                >
                  {mod.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {mod.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    {mod.description}
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-3 flex-1">
                {mod.preview}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
