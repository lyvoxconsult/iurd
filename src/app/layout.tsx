import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IURD U Marizal • Sistema do Rali',
  description: 'Sistema de pontuação, rankings, desafios e gestão do rali da IURD U Marizal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-dark-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
