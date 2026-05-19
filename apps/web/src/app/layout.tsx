import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoPart Intelligence — Catálogo Inteligente de Peças',
  description: 'Consulta inteligente de peças automotivas por part number, código OEM, veículo e compatibilidade',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-800 antialiased">{children}</body>
    </html>
  );
}
