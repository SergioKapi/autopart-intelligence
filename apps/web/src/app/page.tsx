import SearchBar from '@/components/search/SearchBar';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">AP</span>
          </div>
          <div className="leading-tight">
            <span className="font-bold text-gray-900 text-sm">AutoPart</span>
            <span className="font-normal text-blue-600 text-sm"> Intelligence</span>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <a href="/autoparts/busca" className="text-gray-600 hover:text-gray-900 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Buscar</a>
          <a href="/autoparts/auth/login" className="text-gray-600 hover:text-gray-900 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Entrar</a>
          <a href="/autoparts/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ml-1">Cadastrar</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-3xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-1.5 text-blue-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Busca inteligente com IA · Preços em tempo real
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
              Encontre a peça certa{' '}
              <span className="text-blue-600">na primeira busca</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto">
              Part number, código OEM ou descrição. Nossa IA consulta fontes especializadas e retorna compatibilidade, equivalentes e preços em tempo real.
            </p>
          </div>

          <div className="mt-2">
            <SearchBar />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400 pt-2">
            <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> Part Number &amp; OEM</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> Compatibilidade cruzada</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> Preços de múltiplas lojas</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> Equivalentes por fabricante</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-10">Como funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔍', step: '1', title: 'Busque', desc: 'Digite o part number, código OEM ou descrição da peça.' },
              { icon: '🤖', step: '2', title: 'IA consulta', desc: 'Nossa IA busca em catálogos, fabricantes e distribuidores em tempo real.' },
              { icon: '🛒', step: '3', title: 'Compare e compre', desc: 'Veja especificações, compatibilidade e compre pelo menor preço.' },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto mb-2">{item.step}</div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm">{item.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-5 px-6 text-center text-gray-400 text-xs bg-white">
        AutoPart Intelligence · Catálogo inteligente de peças automotivas
      </footer>
    </main>
  );
}
