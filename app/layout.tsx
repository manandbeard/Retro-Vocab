import type {Metadata} from 'next';
import { Inter, Press_Start_2P } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

export const metadata: Metadata = {
  title: 'Retro Arcade Vocab',
  description: 'A retro arcade themed vocabulary and grammar educational app.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart2P.variable}`}>
      <body className="bg-[#0A0A0F] text-white font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
