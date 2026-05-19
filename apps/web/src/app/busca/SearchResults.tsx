'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SearchResultsProps {
  query: string;
  type: 'partnumber' | 'text';
  page: number;
}

export default function SearchResults({ query, type, page }: SearchResultsProps) {
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
      .catch(() => setError('Erro ao buscar. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [query, type, page]);

  if (!query) return <p className="text-gray-500 text-center py-12">Digite algo para buscar.</p>;

  if (loading) return (
    <div className="flex flex-col items-center py-16 gap-4">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400">Consultando fontes especializadas com IA...</p>
    </div>
  );

  if (error) return <p className="text-red-400 text-center py-12">{error}</p>;
  if (!data) return null;

  if (data.type === 'partnumber') return <PartNumberResult data={data} />;
  if (data.type === 'text') return <TextResult data={data} />;
  return <RawResult data={data} />;
}

function PartNumberResult({ data }: { data: any }) {
  const part = data.part;

  if (!data.encontrado || !part) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 text-lg">Peça não encontrada</p>
        <p className="text-gray-600 text-sm mt-2">{data.mensagem}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono font-bold text-brand-400 text-xl">{part.partNumber}</p>
            {part.codigoOEM && <p className="text-gray-500 text-sm font-mono">OEM: {part.codigoOEM}</p>}
          </div>
          <span className="bg-green-900/30 border border-green-800 text-green-400 text-xs px-3 py-1 rounded-full">
            Encontrado
          </span>
        </div>

        <div>
          <p className="text-white font-semibold">{part.fabricante}</p>
          <p className="text-gray-300 mt-1">{part.descricao}</p>
          {part.categoria && <p className="text-brand-400 text-sm mt-1">{part.categoria}</p>}
        </div>

        {part.codigosAlternativos?.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs mb-1">Códigos alternativos</p>
            <div className="flex flex-wrap gap-2">
              {part.codigosAlternativos.map((c: string) => (
                <span key={c} className="font-mono text-xs bg-gray-800 px-2 py-1 rounded">{c}</span>
              ))}
            </div>
          </div>
        )}

        {part.especificacoesTecnicas && Object.keys(part.especificacoesTecnicas).length > 0 && (
          <div>
            <p className="text-gray-500 text-xs mb-2">Especificações técnicas</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(part.especificacoesTecnicas).map(([k, v]) => (
                <div key={k} className="bg-gray-800 rounded px-3 py-2">
                  <p className="text-gray-500 text-xs">{k}</p>
                  <p className="text-white text-sm">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {part.veiculosCompativeis?.length > 0 && (
        <div className="card">
          <p className="text-gray-400 text-sm font-semibold mb-3">Veículos compatíveis</p>
          <div className="space-y-2">
            {part.veiculosCompativeis.map((v: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />
                <span className="text-white">{v.marca} {v.modelo}</span>
                {v.motor && <span className="text-gray-500">{v.motor}</span>}
                {v.anoInicio && (
                  <span className="text-gray-500 ml-auto">
                    {v.anoInicio}{v.anoFim ? `–${v.anoFim}` : '+'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {part.equivalentes?.length > 0 && (
        <div className="card">
          <p className="text-gray-400 text-sm font-semibold mb-3">Equivalentes de outros fabricantes</p>
          <div className="space-y-2">
            {part.equivalentes.map((eq: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{eq.fabricante}</span>
                <span className="font-mono text-brand-400">{eq.codigo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {part.observacoes && (
        <div className="card border-yellow-900/50">
          <p className="text-gray-400 text-xs mb-1">Observações</p>
          <p className="text-gray-300 text-sm">{part.observacoes}</p>
        </div>
      )}

      {part.fontes?.length > 0 && (
        <p className="text-gray-600 text-xs">
          Fontes: {part.fontes.join(' · ')}
        </p>
      )}
    </div>
  );
}

function TextResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        {data.total} resultado{data.total !== 1 ? 's' : ''} para{' '}
        <span className="text-white font-medium">"{data.query}"</span>
      </p>

      {data.results?.map((part: any, i: number) => (
        <div key={i} className="card space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono font-bold text-brand-400">{part.partNumber}</p>
              <p className="text-gray-500 text-xs">{part.fabricante}</p>
            </div>
            {part.categoria && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{part.categoria}</span>
            )}
          </div>
          <p className="text-white text-sm">{part.descricao}</p>
          {part.veiculosCompativeis?.length > 0 && (
            <p className="text-gray-500 text-xs">{part.veiculosCompativeis.slice(0, 3).join(' · ')}</p>
          )}
          {part.relevancia && (
            <p className="text-gray-600 text-xs italic">{part.relevancia}</p>
          )}
        </div>
      ))}

      {data.sugestoes?.length > 0 && (
        <div className="card">
          <p className="text-gray-500 text-xs mb-2">Refine sua busca</p>
          <div className="flex flex-wrap gap-2">
            {data.sugestoes.map((s: string) => (
              <span key={s} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-700">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RawResult({ data }: { data: any }) {
  return (
    <div className="card">
      <p className="text-gray-400 text-sm whitespace-pre-wrap">{data.rawResponse}</p>
    </div>
  );
}
