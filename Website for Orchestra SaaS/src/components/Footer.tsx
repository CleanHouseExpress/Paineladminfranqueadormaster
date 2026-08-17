const columns = [
  {
    title: 'Plataforma',
    links: ['Operações', 'Implantação', 'Catálogo', 'Estoque', 'Financeiro', 'Comunicação', 'IA'],
  },
  {
    title: 'Soluções',
    links: ['Para Franqueadoras', 'Para Franqueados', 'Multiunidade', 'Integrações'],
  },
  {
    title: 'Empresa',
    links: ['Sobre a Orchestra', 'Contato'],
  },
  {
    title: 'Legal',
    links: ['Privacidade', 'Termos de uso'],
  },
]

interface FooterProps {
  onDemo: () => void
}

export default function Footer({ onDemo }: FooterProps) {
  return (
    <footer className="bg-zinc-950 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7">
                <svg viewBox="0 0 28 28" fill="none" className="w-full h-full">
                  <rect x="2" y="2" width="8" height="8" rx="2" fill="#818CF8" />
                  <rect x="18" y="2" width="8" height="8" rx="2" fill="#818CF8" opacity="0.5" />
                  <rect x="2" y="18" width="8" height="8" rx="2" fill="#818CF8" opacity="0.5" />
                  <rect x="18" y="18" width="8" height="8" rx="2" fill="#818CF8" opacity="0.25" />
                  <line x1="10" y1="6" x2="18" y2="6" stroke="#818CF8" strokeWidth="1.5" />
                  <line x1="6" y1="10" x2="6" y2="18" stroke="#818CF8" strokeWidth="1.5" />
                  <line x1="22" y1="10" x2="22" y2="18" stroke="#818CF8" strokeWidth="1.5" opacity="0.5" />
                  <line x1="10" y1="22" x2="18" y2="22" stroke="#818CF8" strokeWidth="1.5" opacity="0.5" />
                </svg>
              </div>
              <span
                className="text-[17px] font-bold text-white tracking-tight"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Orchestra
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              Tecnologia para redes que querem operar melhor.
            </p>
            <button
              onClick={onDemo}
              className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Solicitar demonstração
            </button>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4
                className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors no-underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Orchestra Tecnologia. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors no-underline">
              Privacidade
            </a>
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors no-underline">
              Termos
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
