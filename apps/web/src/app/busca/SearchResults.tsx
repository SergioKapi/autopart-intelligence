'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

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
    <div className="flex flex-col items-center py-20 gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-gray-200 font-medium">Consultando fontes especializadas</p>
        <p className="text-gray-500 text-sm mt-1">Buscando dados técnicos, preços e compatibilidade...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="rounded-xl border border-red-900/50 bg-red-900/10 p-6 text-center">
      <p className="text-red-400">{error}</p>
    </div>
  );

  if (!data) return null;

  if (!data.encontrado && data.type === 'partnumber') return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-gray-300 font-medium">Peça não encontrada</p>
      <p className="text-gray-600 text-sm mt-1">{data.mensagem}</p>
    </div>
  );

  if (data.type === 'partnumber' && data.part) return <PartDetail part={data.part} />;
  if (data.type === 'text') return <TextResults data={data} />;
  return null;
}

function PartDetail({ part }: { part: any }) {
  const prices = part.precos;
  const cheapest = prices?.maisBarato;

  return (
    <div className="space-y-4">
      {/* Main card */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Photo */}
          <div className="md:w-64 md:flex-shrink-0 bg-gray-800/50 flex items-center justify-center p-6 min-h-[200px]">
            {part.foto ? (
              <img
                src={part.foto}
                alt={part.descricao}
                className="max-h-48 max-w-full object-contain rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="text-center text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Sem imagem</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-blue-400 text-2xl">{part.partNumber}</span>
                  {part.codigoOEM && (
                    <span className="font-mono text-gray-500 text-sm bg-gray-800 px-2 py-0.5 rounded">OEM: {part.codigoOEM}</span>
                  )}
                  <span className="text-xs bg-green-900/40 border border-green-800 text-green-400 px-2 py-0.5 rounded-full">✓ Encontrado</span>
                </div>
                <p className="text-xl font-semibold text-white mt-1">{part.descricao}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-blue-400 text-sm font-medium">{part.fabricante}</span>
                  {part.categoria && (
                    <>
                      <span className="text-gray-700">·</span>
                      <span className="text-gray-400 text-sm">{part.categoria}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Alternate codes */}
            {part.codigosAlternativos?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-gray-500 text-xs self-center">Também conhecido como:</span>
                {part.codigosAlternativos.map((c: string) => (
                  <span key={c} className="font-mono text-xs bg-gray-800 border border-gray-700 px-2 py-1 rounded text-gray-300">{c}</span>
                ))}
              </div>
            )}

            {/* Price banner */}
            {cheapest && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-blue-950/40 border border-blue-900/60 rounded-xl p-4">
                <div className="flex-1">
                  <p className="text-gray-400 text-xs mb-0.5">Menor preço encontrado</p>
                  <p className="text-3xl font-bold text-white">{cheapest.preco}</p>
                  <p className="text-gray-500 text-xs mt-0.5">em {cheapest.loja}</p>
                  {prices.faixaMaxima && prices.faixaMinima !== prices.faixaMaxima && (
                    <p className="text-gray-600 text-xs mt-1">Faixa: {prices.faixaMinima} – {prices.faixaMaxima}</p>
                  )}
                </div>
                <a
                  href={cheapest.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                >
                  Comprar mais barato
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Compatible vehicles */}
        {part.veiculosCompativeis?.length > 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-900/40 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h10a1 1 0 001-1z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white">Veículos compatíveis</h3>
              <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{part.veiculosCompativeis.length}</span>
            </div>
            <div className="space-y-2">
              {part.veiculosCompativeis.map((v: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm font-medium">{v.marca} {v.modelo}</span>
                    {v.motor && <span className="text-gray-500 text-sm ml-2">{v.motor}</span>}
                  </div>
                  {(v.anoInicio || v.anoFim) && (
                    <span className="text-gray-500 text-xs flex-shrink-0">
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
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-900/40 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-white">Equivalentes</h3>
            </div>
            <div className="space-y-2">
              {part.equivalentes.map((eq: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-300 text-sm">{eq.fabricante}</span>
                  <span className="font-mono text-purple-400 text-sm bg-purple-900/20 px-2 py-0.5 rounded">{eq.codigo}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Technical specs */}
      {part.especificacoesTecnicas && Object.keys(part.especificacoesTecnicas).length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">Especificações técnicas</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(part.especificacoesTecnicas).map(([k, v]) => (
              <div key={k} className="bg-gray-800/60 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1 capitalize">{k}</p>
                <p className="text-white text-sm font-medium">{String(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* More prices */}
      {prices?.maisCaros?.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="font-semibold text-white mb-4">Mais opções de compra</h3>
          <div className="space-y-3">
            {prices.maisCaros.map((p: any, i: number) => (
              <a
                key={i}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all group"
              >
                {p.imagem && (
                  <img src={p.imagem} alt="" className="w-12 h-12 object-contain rounded-lg bg-gray-700 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm truncate">{p.titulo}</p>
                  <p className="text-gray-500 text-xs">{p.loja}</p>
                  {p.avaliacao && <p className="text-yellow-400 text-xs">★ {p.avaliacao} ({p.avaliacoes})</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-semibold">{p.preco}</p>
                  <p className="text-blue-400 text-xs group-hover:underline">Ver oferta →</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Observations */}
      {part.observacoes && (
        <div className="rounded-2xl border border-yellow-900/40 bg-yellow-900/10 p-5">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-yellow-400 text-sm font-medium mb-1">Observações técnicas</p>
              <p className="text-gray-300 text-sm">{part.observacoes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sources */}
      {part.fontes?.length > 0 && (
        <p className="text-gray-700 text-xs px-1">
          Fontes: {part.fontes.slice(0, 3).join(' · ')}
        </p>
      )}
    </div>
  );
}

function TextResults({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        <span className="text-white font-semibold">{data.total}</span> resultado{data.total !== 1 ? 's' : ''} para{' '}
        <span className="text-blue-400">"{data.query}"</span>
      </p>

      {data.results?.map((part: any, i: number) => (
        <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 transition-colors">
          <div className="flex gap-4">
            {part.foto && (
              <img src={part.foto} alt="" className="w-20 h-20 object-contain rounded-xl bg-gray-800 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-blue-400">{part.partNumber}</span>
                {part.categoria && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{part.categoria}</span>}
              </div>
              <p className="text-gray-500 text-xs mb-1">{part.fabricante}</p>
              <p className="text-white text-sm">{part.descricao}</p>
              {part.veiculosCompativeis?.length > 0 && (
                <p className="text-gray-600 text-xs mt-2">{part.veiculosCompativeis.slice(0, 3).join(' · ')}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {data.sugestoes?.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-gray-500 text-xs mb-3">Refine sua busca</p>
          <div className="flex flex-wrap gap-2">
            {data.sugestoes.map((s: string) => (
              <span key={s} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full cursor-pointer transition-colors border border-gray-700">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
