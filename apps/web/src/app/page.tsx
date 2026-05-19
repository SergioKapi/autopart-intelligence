import SearchBar from '@/components/search/SearchBar';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-950">
      <header className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-50 bg-gray-950/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <span className="text-white font-bold text-sm">AP</span>
          </div>
          <div>
            <span className="font-bold text-white">AutoPart</span>
            <span className="font-light text-blue-400"> Intelligence</span>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <a href="/autoparts/busca" className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5">Buscar</a>
          <a href="/autoparts/auth/login" className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5">Entrar</a>
          <a href="/autoparts/auth/register" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">Cadastrar</a>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl w-full text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 bg-blue-950/50 border border-blue-900/60 rounded-full px-4 py-1.5 text-blue-400 text-sm">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Busca inteligente com IA · Preços em tempo real
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Encontre a peça certa{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                na primeira busca
              </span>
            </h1>
            <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mx-auto">
              Part number, código OEM, veículo ou descrição. Nossa IA consulta fontes especializadas e retorna compatibilidade, equivalentes e os melhores preços em tempo real.
            </p>
          </div>

          <div className="mt-4">
            <SearchBar />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Busca por Part Number</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Compatibilidade cruzada</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Preços de múltiplas lojas</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Equivalentes por fabricante</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-800/60 py-20 px-6 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Como funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔍', step: '1', title: 'Busque', desc: 'Digite o part number, código OEM ou descrição da peça. Também pode buscar pelo veículo.' },
              { icon: '🤖', step: '2', title: 'IA consulta', desc: 'Nossa IA busca em catálogos, fabricantes e distribuidores especializados em tempo real.' },
              { icon: '🛒', step: '3', title: 'Compare e compre', desc: 'Veja especificações, compatibilidade, equivalentes e compre pelo menor preço encontrado.' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto mb-3">{item.step}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800/60 py-6 px-6 text-center text-gray-700 text-sm">
        AutoPart Intelligence · Catálogo inteligente de peças automotivas
      </footer>
    </main>
  );
}
