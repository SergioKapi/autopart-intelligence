import SearchBar from '@/components/search/SearchBar';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AP</span>
          </div>
          <span className="font-bold text-lg text-white">AutoPart Intelligence</span>
        </div>
        <nav className="flex items-center gap-4">
          <a href="/autoparts/busca" className="text-gray-400 hover:text-white text-sm transition-colors">Busca</a>
          <a href="/autoparts/auth/login" className="text-gray-400 hover:text-white text-sm transition-colors">Entrar</a>
          <a href="/autoparts/auth/register" className="btn-primary text-sm">Cadastrar</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand-900/30 border border-brand-800 rounded-full px-4 py-1.5 text-brand-400 text-sm">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            Catálogo inteligente de peças automotivas
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight">
            Encontre a peça certa{' '}
            <span className="text-brand-400">na primeira busca</span>
          </h1>

          <p className="text-gray-400 text-xl">
            Busque por part number, código OEM, veículo ou descrição.
            Compatibilidade cruzada entre fabricantes.
          </p>

          <div className="mt-8">
            <SearchBar />
          </div>

          <div className="flex items-center justify-center gap-8 pt-4 text-sm text-gray-500">
            <span>✓ Busca por part number</span>
            <span>✓ Compatibilidade cruzada</span>
            <span>✓ Manuais técnicos</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Peças catalogadas', value: '—' },
            { label: 'Fabricantes', value: '—' },
            { label: 'Veículos compatíveis', value: '—' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
