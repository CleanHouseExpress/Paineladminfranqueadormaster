import { useState, useEffect } from 'react'

const navItems = [
  { label: 'Plataforma', href: '#plataforma' },
  { label: 'Soluções', href: '#solucoes' },
  { label: 'Para Franqueadoras', href: '#franqueadoras' },
  { label: 'Para Franqueados', href: '#franqueados' },
  { label: 'IA', href: '#ia' },
  { label: 'Empresa', href: '#empresa' },
]

interface HeaderProps {
  onDemo: () => void
}

export default function Header({ onDemo }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-zinc-200/80 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 relative">
                <svg viewBox="0 0 28 28" fill="none" className="w-full h-full">
                  <rect x="2" y="2" width="8" height="8" rx="2" fill="#4F46E5" />
                  <rect x="18" y="2" width="8" height="8" rx="2" fill="#818CF8" opacity="0.6" />
                  <rect x="2" y="18" width="8" height="8" rx="2" fill="#818CF8" opacity="0.6" />
                  <rect x="18" y="18" width="8" height="8" rx="2" fill="#4F46E5" opacity="0.3" />
                  <line x1="10" y1="6" x2="18" y2="6" stroke="#4F46E5" strokeWidth="1.5" />
                  <line x1="6" y1="10" x2="6" y2="18" stroke="#4F46E5" strokeWidth="1.5" />
                  <line x1="22" y1="10" x2="22" y2="18" stroke="#818CF8" strokeWidth="1.5" opacity="0.6" />
                  <line x1="10" y1="22" x2="18" y2="22" stroke="#818CF8" strokeWidth="1.5" opacity="0.6" />
                </svg>
              </div>
              <span
                className="text-[17px] font-bold text-zinc-950 tracking-tight"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Orchestra
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3.5 py-2 text-sm text-zinc-600 hover:text-zinc-950 rounded-md hover:bg-zinc-100 transition-colors duration-150 no-underline"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a href="/login" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-2 no-underline">
              Entrar
            </a>
            <button
              onClick={onDemo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-150 cursor-pointer"
            >
              Solicitar demonstração
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            aria-controls="website-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {menuOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMenuOpen(false)} />
          <div id="website-mobile-menu" className="absolute top-16 left-0 right-0 bg-white border-b border-zinc-200 shadow-xl">
            <nav className="px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors no-underline"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 border-t border-zinc-100 mt-2 flex flex-col gap-2">
                <a
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-zinc-600 px-4 py-3 text-left hover:bg-zinc-50 rounded-lg transition-colors no-underline"
                >
                  Entrar
                </a>
                <button
                  onClick={() => { setMenuOpen(false); onDemo() }}
                  className="bg-indigo-600 text-white text-sm font-semibold px-4 py-3 rounded-lg w-full cursor-pointer"
                >
                  Solicitar demonstração
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
