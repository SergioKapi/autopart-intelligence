'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SearchTab = 'partnumber' | 'text' | 'vehicle';

const TABS: { id: SearchTab; label: string; placeholder: string }[] = [
  { id: 'partnumber', label: 'Part Number / OEM', placeholder: 'Ex: 06H103495AH, F000BL0653...' },
  { id: 'text', label: 'Descrição', placeholder: 'Ex: bomba alta pressão amarok, pastilha civic...' },
  { id: 'vehicle', label: 'Por Veículo', placeholder: 'Selecione marca, modelo e ano...' },
];

export default function SearchBar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SearchTab>('partnumber');
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/busca?q=${encodeURIComponent(query)}&type=${activeTab}`);
  };

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-gray-900 rounded-lg p-1 border border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={currentTab.placeholder}
          className="input-base flex-1 text-base"
          autoFocus
        />
        <button
          type="submit"
          className="btn-primary whitespace-nowrap"
          disabled={!query.trim()}
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
