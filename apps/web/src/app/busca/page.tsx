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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <SearchBar />
      <SearchResults query={q} type={type} page={page} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center shadow-sm sticky top-0 z-50">
        <a href="/autoparts/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">AP</span>
          </div>
          <div className="leading-tight">
            <span className="font-bold text-gray-900 text-sm">AutoPart</span>
            <span className="font-normal text-blue-600 text-sm"> Intelligence</span>
          </div>
        </a>
      </header>
      <Suspense fallback={
        <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400 text-sm">Carregando...</div>
      }>
        <BuscaContent />
      </Suspense>
    </main>
  );
}
