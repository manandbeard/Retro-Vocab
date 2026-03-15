'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const BackgroundGame = dynamic(() => import('@/components/BackgroundGame'), {
  ssr: false,
});

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#0A0A0F]">
      {/* Background Game Component */}
      <BackgroundGame />

      {/* Main Content Overlay */}
      <div className="text-center space-y-12 z-10">
        <div className="space-y-4">
          <h1 className="font-pixel text-4xl md:text-7xl text-[#00FFD5] drop-shadow-[0_0_15px_rgba(0,255,213,0.8)] leading-tight animate-pulse">
            VOCAB<br/>ARCADE
          </h1>
          <p className="text-[#FF2DAA] font-pixel text-sm md:text-lg tracking-[0.3em] drop-shadow-[0_0_5px_rgba(255,45,170,0.5)]">
            LEVEL UP YOUR LEARNING
          </p>
        </div>

        <div className="flex flex-col gap-6 items-center">
          <Link
            href="/login?role=student"
            className="group relative inline-flex items-center justify-center px-10 py-5 font-pixel text-xl text-[#0A0A0F] bg-[#00FFD5] hover:bg-white transition-all duration-200 uppercase tracking-wider cursor-pointer w-64"
            style={{
              boxShadow: '0 0 20px rgba(0,255,213,0.6), inset 0 0 10px rgba(255,255,255,0.5)',
              clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)'
            }}
          >
            Student Login
          </Link>

          <Link
            href="/login?role=teacher"
            className="group relative inline-flex items-center justify-center px-10 py-5 font-pixel text-xl text-white bg-transparent border-2 border-[#FF2DAA] hover:bg-[#FF2DAA] hover:text-[#0A0A0F] transition-all duration-200 uppercase tracking-wider cursor-pointer w-64"
            style={{
              boxShadow: '0 0 15px rgba(255,45,170,0.4)',
              clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)'
            }}
          >
            Teacher Login
          </Link>
        </div>

        <div className="pt-12">
          <p className="text-gray-500 font-pixel text-[10px] animate-bounce">
            PRESS ANY KEY OR CLICK TO START
          </p>
        </div>
      </div>

      {/* CRT Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] z-20 opacity-30" />
      
      {/* CRT Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{
        background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
      }} />
    </div>
  );
}
