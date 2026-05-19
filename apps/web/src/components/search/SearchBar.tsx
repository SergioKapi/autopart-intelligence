'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SearchTab = 'partnumber' | 'text' | 'vehicle';

const TABS: { id: SearchTab; label: string; placeholder: string }[] = [
  { id: 'partnumber', label: 'Part Number / OEM', placeholder: 'Ex: 51983537, 06H103495AH, F000BL0653...' },
  { id: 'text', label: 'Descrição', placeholder: 'Ex: bomba alta pressão amarok, pastilha civic...' },
  { id: 'vehicle', label: 'Por Veículo', placeholder: 'Em breve...' },
];

export default function SearchBar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SearchTab>('partnumber');
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || activeTab === 'vehicle') return;
    router.push(`/busca/?q=${encodeURIComponent(query)}&type=${activeTab}`);
  };

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-0 mb-3 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {TABS.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 text-sm font-medium transition-all border-r last:border-r-0 border-gray-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2 shadow-sm">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={currentTab.placeholder}
          disabled={activeTab === 'vehicle'}
          className="flex-1 bg-white border border-gray-300 focus:border-blue-500 text-gray-800 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400 transition-all disabled:opacity-40 disabled:bg-gray-50"
          autoFocus
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          disabled={!query.trim() || activeTab === 'vehicle'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar
        </button>
      </form>
    </div>
  );
}
