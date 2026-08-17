const items = [
  { label: 'Criado para operações multiunidade' },
  { label: 'Arquitetura preparada para redes em crescimento' },
  { label: 'Gestão central + operação local' },
  { label: 'Processos, dados e unidades conectados' },
]

export default function TrustBar() {
  return (
    <div className="bg-white border-y border-zinc-100">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <span className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </div>
              {i < items.length - 1 && (
                <div className="hidden sm:block w-px h-4 bg-zinc-200 mx-3" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
