'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SearchResults({ query, type, page }: { query: string; type: string; page: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`${API}/search?q=${encodeURIComponent(query)}&type=${type}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('Erro ao buscar. Verifique sua conexão e tente novamente.'))
      .finally(() => setLoading(false));
  }, [query, type, page]);

  if (!query) return null;

  if (loading) return (
    <div className="flex flex-col items-center py-16 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-3 border-blue-100 rounded-full border-[3px]" />
        <div className="absolute inset-0 border-[3px] border-transparent border-t-blue-500 rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-medium text-sm">Consultando fontes especializadas</p>
        <p className="text-gray-400 text-xs mt-1">Buscando dados técnicos, preços e compatibilidade...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  );

  if (!data) return null;

  if (!data.encontrado && data.type === 'partnumber') return (
    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-gray-700 font-medium text-sm">Peça não encontrada</p>
      <p className="text-gray-400 text-xs mt-1">{data.mensagem}</p>
    </div>
  );

  if (data.type === 'partnumber' && data.part) return <PartDetail part={data.part} />;
  if (data.type === 'text') return <TextResults data={data} />;
  return null;
}

function PartDetail({ part }: { part: any }) {
  const prices = part.precos;
  const cheapest = prices?.maisBarato;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="space-y-3">

      {/* Main product card — ML 2-column layout */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* Left: Image */}
          <div className="md:w-80 md:flex-shrink-0 flex items-center justify-center p-8 bg-white border-b md:border-b-0 md:border-r border-gray-100 min-h-[260px]">
            {part.foto && !imgError ? (
              <img
                src={part.foto}
                alt={part.descricao}
                className="max-h-56 max-w-full object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="text-center text-gray-300">
                <svg className="w-20 h-20 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-400">Sem imagem</p>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex-1 p-6 flex flex-col gap-4">

            {/* Category breadcrumb */}
            {part.categoria && (
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">{part.categoria}</p>
            )}

            {/* Title + part number */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-snug mb-1">{part.descricao}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs text-gray-500">Cod:</span>
                <span className="font-mono font-semibold text-gray-800 text-sm">{part.partNumber}</span>
                {part.codigoOEM && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">OEM:</span>
                    <span className="font-mono text-xs text-gray-600">{part.codigoOEM}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-blue-600 font-medium mt-1">{part.fabricante}</p>
            </div>

            {/* Alternate codes */}
            {part.codigosAlternativos?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-gray-400">Também:</span>
                {part.codigosAlternativos.map((c: string) => (
                  <span key={c} className="font-mono text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-600">{c}</span>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Price section */}
            {cheapest ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Menor preço encontrado</p>
                  <p className="text-3xl font-bold text-gray-900">{cheapest.preco}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    em <span className="text-gray-600 font-medium">{cheapest.loja}</span>
                    {prices.faixaMaxima && prices.faixaMinima !== prices.faixaMaxima && (
                      <span className="ml-2 text-gray-400">· Faixa: {prices.faixaMinima} – {prices.faixaMaxima}</span>
                    )}
                  </p>
                </div>
                <a
                  href={cheapest.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Ver oferta mais barata
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-400 text-sm">Preço não disponível</p>
                <p className="text-gray-300 text-xs mt-0.5">Consulte os fornecedores</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary sections: 2 columns */}
      <div className="grid md:grid-cols-2 gap-3">

        {/* Compatible vehicles */}
        {part.veiculosCompativeis?.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h10a1 1 0 001-1z" />
              </svg>
              <h3 className="font-semibold text-gray-800 text-sm">Veículos compatíveis</h3>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{part.veiculosCompativeis.length}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {part.veiculosCompativeis.map((v: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-800 text-sm font-medium">{v.marca} {v.modelo}</span>
                    {v.motor && <span className="text-gray-400 text-xs ml-2">{v.motor}</span>}
                  </div>
                  {(v.anoInicio || v.anoFim) && (
                    <span className="text-gray-400 text-xs flex-shrink-0">
                      {v.anoInicio}{v.anoFim && v.anoFim !== v.anoInicio ? `–${v.anoFim}` : v.anoInicio ? '+' : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equivalents */}
        {part.equivalentes?.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h3 className="font-semibold text-gray-800 text-sm">Equivalentes</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {part.equivalentes.map((eq: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-gray-600 text-sm">{eq.fabricante}</span>
                  <span className="font-mono text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">{eq.codigo}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Technical specs */}
      {part.especificacoesTecnicas && Object.keys(part.especificacoesTecnicas).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="font-semibold text-gray-800 text-sm">Especificações técnicas</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(part.especificacoesTecnicas).map(([k, v]) => (
              <div key={k} className="flex items-start py-2 gap-4">
                <span className="text-gray-400 text-sm capitalize w-40 flex-shrink-0">{k}</span>
                <span className="text-gray-800 text-sm font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* More prices */}
      {prices?.maisCaros?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Mais opções de compra</h3>
          <div className="divide-y divide-gray-100">
            {prices.maisCaros.map((p: any, i: number) => (
              <a
                key={i}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors group rounded-lg px-2 -mx-2"
              >
                {p.imagem && (
                  <img
                    src={p.imagem}
                    alt=""
                    className="w-10 h-10 object-contain rounded bg-gray-50 border border-gray-100 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 text-sm truncate leading-snug">{p.titulo}</p>
                  <p className="text-gray-400 text-xs">{p.loja}</p>
                  {p.avaliacao && (
                    <p className="text-yellow-500 text-xs">★ {p.avaliacao}
                      {p.avaliacoes && <span className="text-gray-400 ml-1">({p.avaliacoes})</span>}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-900 font-semibold text-sm">{p.preco}</p>
                  <p className="text-blue-600 text-xs group-hover:underline">Ver oferta →</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Observations */}
      {part.observacoes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-amber-700 text-xs font-semibold mb-0.5">Observações técnicas</p>
              <p className="text-amber-800 text-sm">{part.observacoes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sources */}
      {part.fontes?.length > 0 && (
        <p className="text-gray-300 text-xs px-1">
          Fontes: {part.fontes.slice(0, 3).join(' · ')}
        </p>
      )}
    </div>
  );
}

function TextResults({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <p className="text-gray-500 text-sm">
        <span className="text-gray-800 font-semibold">{data.total}</span> resultado{data.total !== 1 ? 's' : ''} para{' '}
        <span className="text-blue-600">"{data.query}"</span>
      </p>

      {data.results?.map((part: any, i: number) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm">
          <div className="flex gap-4">
            {part.foto && (
              <img
                src={part.foto}
                alt=""
                className="w-16 h-16 object-contain rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-mono font-semibold text-blue-600 text-sm">{part.partNumber}</span>
                {part.categoria && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{part.categoria}</span>
                )}
              </div>
              <p className="text-gray-400 text-xs mb-1">{part.fabricante}</p>
              <p className="text-gray-800 text-sm leading-snug">{part.descricao}</p>
              {part.veiculosCompativeis?.length > 0 && (
                <p className="text-gray-400 text-xs mt-1.5">{part.veiculosCompativeis.slice(0, 3).join(' · ')}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {data.sugestoes?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-gray-400 text-xs mb-2">Refine sua busca</p>
          <div className="flex flex-wrap gap-2">
            {data.sugestoes.map((s: string) => (
              <span
                key={s}
                className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-gray-600 px-3 py-1.5 rounded-full cursor-pointer transition-colors border border-gray-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
