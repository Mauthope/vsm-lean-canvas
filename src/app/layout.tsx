import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800']
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'VSM Lean Canvas - Mapeamento de Fluxo de Valor Corporativo',
  description: 'Single Page Application interativa de Mapeamento de Fluxo de Valor (VSM) para processos de RH e administrativos no estilo BagTime. Desenvolvido por Mauricio Grigol.',
  authors: [{ name: 'Mauricio Grigol' }]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${outfit.variable} ${inter.variable} font-sans bg-[#060a13] text-slate-100 min-h-screen antialiased flex flex-col selection:bg-cyan-500 selection:text-slate-950`}>
        <Navbar />
        <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 pb-28">
          {children}
        </main>
      </body>
    </html>
  );
}
