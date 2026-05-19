import Image from 'next/image';
import Link from 'next/link';

interface Part {
  id: string;
  partNumber: string;
  oemCode?: string;
  description: string;
  partType: string;
  status: string;
  manufacturer: { name: string };
  category?: { name: string };
  media?: { url: string }[];
}

export default function PartCard({ part }: { part: Part }) {
  const image = part.media?.[0]?.url;

  return (
    <Link href={`/pecas/${part.id}`} className="card hover:border-brand-700 transition-colors block">
      <div className="flex gap-4">
        {image ? (
          <Image src={image} alt={part.description} width={80} height={80} className="rounded-lg object-cover bg-gray-800" />
        ) : (
          <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-xs">
            Sem foto
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono font-bold text-brand-400 text-sm">{part.partNumber}</p>
              {part.oemCode && (
                <p className="text-gray-500 text-xs font-mono">OEM: {part.oemCode}</p>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              part.status === 'ACTIVE'
                ? 'border-green-800 text-green-400 bg-green-900/20'
                : 'border-gray-700 text-gray-500'
            }`}>
              {part.status === 'ACTIVE' ? 'Ativo' : part.status}
            </span>
          </div>

          <p className="text-white text-sm mt-1 line-clamp-2">{part.description}</p>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{part.manufacturer.name}</span>
            {part.category && <span>· {part.category.name}</span>}
            <span className="ml-auto capitalize">{part.partType?.toLowerCase()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
