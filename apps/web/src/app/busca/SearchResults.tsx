'use client';

import { useEffect, useState } from 'react';
import PartCard from '@/components/parts/PartCard';

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
    fetch(`${API}/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('Erro ao buscar. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [query, type, page]);

  if (!query) return <p className="text-gray-500 text-center py-12">Digite algo para buscar.</p>;
  if (loading) return <p className="text-gray-500 text-center py-12">Buscando...</p>;
  if (error) return <p className="text-red-400 text-center py-12">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        {data.total} resultado{data.total !== 1 ? 's' : ''} para{' '}
        <span className="text-white font-medium">"{query}"</span>
      </p>

      {data.data?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">Nenhuma peça encontrada.</p>
          <p className="text-gray-600 text-sm mt-2">Tente outro part number ou descrição.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data?.map((part: any) => (
            <PartCard key={part.id} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}
