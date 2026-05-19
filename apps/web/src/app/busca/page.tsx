'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import SearchResults from './SearchResults';

function BuscaContent() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const type = (params.get('type') as 'partnumber' | 'text') || 'text';
  const page = Number(params.get('page')) || 1;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <SearchBar />
      <SearchResults query={q} type={type} page={page} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AP</span>
          </div>
          <span className="font-bold text-lg text-white">AutoPart Intelligence</span>
        </a>
      </header>
      <Suspense fallback={<div className="text-center py-12 text-gray-500">Carregando...</div>}>
        <BuscaContent />
      </Suspense>
    </main>
  );
}
