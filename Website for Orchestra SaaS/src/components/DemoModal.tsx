import { useState, useEffect } from 'react'

interface DemoModalProps {
  open: boolean
  onClose: () => void
}

const unitOptions = ['1–5 unidades', '6–20 unidades', '21–50 unidades', '51–200 unidades', '201–500 unidades', '500+ unidades']

export default function DemoModal({ open, onClose }: DemoModalProps) {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    name: '', company: '', role: '', email: '', phone: '', units: '', message: '',
  })

  useEffect(() => {
    if (!open) { setTimeout(() => setSent(false), 300) }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-up">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 py-7">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-6">
              <svg viewBox="0 0 28 28" fill="none" className="w-full h-full">
                <rect x="2" y="2" width="8" height="8" rx="2" fill="white" />
                <rect x="18" y="2" width="8" height="8" rx="2" fill="white" opacity="0.5" />
                <rect x="2" y="18" width="8" height="8" rx="2" fill="white" opacity="0.5" />
                <rect x="18" y="18" width="8" height="8" rx="2" fill="white" opacity="0.25" />
                <line x1="10" y1="6" x2="18" y2="6" stroke="white" strokeWidth="1.5" />
                <line x1="6" y1="10" x2="6" y2="18" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-white font-bold text-base" style={{ fontFamily: 'Manrope, sans-serif' }}>Orchestra</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Solicitar demonstração
          </h2>
          <p className="text-indigo-200 text-sm">
            Nosso time entra em contato em até 1 dia útil.
          </p>
        </div>

        {sent ? (
          <div className="px-8 py-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Mensagem enviada!
            </h3>
            <p className="text-sm text-zinc-500">
              Obrigado pelo interesse. Nosso time da Orchestra entrará em contato em breve.
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-indigo-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Nome</label>
                <input
                  required value={form.name} onChange={set('name')}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Empresa</label>
                <input
                  required value={form.company} onChange={set('company')}
                  placeholder="Sua empresa"
                  className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Cargo</label>
              <input
                value={form.role} onChange={set('role')}
                placeholder="CEO, Diretor de Operações..."
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-zinc-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">E-mail corporativo</label>
                <input
                  required type="email" value={form.email} onChange={set('email')}
                  placeholder="voce@empresa.com"
                  className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Telefone</label>
                <input
                  value={form.phone} onChange={set('phone')}
                  placeholder="(11) 90000-0000"
                  className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Número de unidades</label>
              <select
                value={form.units} onChange={set('units')}
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-zinc-700 bg-white"
              >
                <option value="">Selecione...</option>
                {unitOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Mensagem (opcional)</label>
              <textarea
                value={form.message} onChange={set('message')}
                rows={3}
                placeholder="Conte um pouco sobre sua operação..."
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none placeholder:text-zinc-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors cursor-pointer"
            >
              Quero conhecer a Orchestra
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
