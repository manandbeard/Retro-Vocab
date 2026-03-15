'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'motion/react';
import { Terminal, User, GraduationCap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const initialRole = searchParams.get('role');
  const [role, setRole] = useState<'student' | 'teacher'>(
    (initialRole === 'student' || initialRole === 'teacher') ? initialRole : 'student'
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Email login not implemented for MVP
    alert(`Email login is disabled for MVP. Please use Google Login.`);
  };

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google/url?role=${role}`;
  };

  const accentColor = role === 'student' ? '#00FFD5' : '#FF2DAA';
  const glowClass = role === 'student' ? 'shadow-[0_0_15px_rgba(0,255,213,0.4)]' : 'shadow-[0_0_15px_rgba(255,45,170,0.4)]';
  const borderClass = role === 'student' ? 'border-[#00FFD5]' : 'border-[#FF2DAA]';
  const textClass = role === 'student' ? 'text-[#00FFD5]' : 'text-[#FF2DAA]';
  const bgClass = role === 'student' ? 'bg-[#00FFD5]' : 'bg-[#FF2DAA]';

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* CRT Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-50 opacity-10" />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-12 z-10"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1 
            animate={{ 
              textShadow: [
                `0 0 10px ${accentColor}`,
                `0 0 20px ${accentColor}`,
                `0 0 10px ${accentColor}`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="font-pixel text-4xl md:text-5xl text-white leading-tight tracking-tighter"
          >
            VOCAB<br/>ARCADE
          </motion.h1>
          <p className="font-pixel text-[10px] text-gray-500 tracking-[0.2em] uppercase">
            Insert Credentials to Continue
          </p>
        </div>

        {/* Role Selection ("Character Select") */}
        <div className="space-y-4">
          <label className="font-pixel text-[10px] text-gray-400 block text-center uppercase tracking-widest">
            Select Player
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 flex flex-col items-center gap-3 p-4 border-2 transition-all duration-300 ${
                role === 'student' 
                  ? 'border-[#00FFD5] bg-[#00FFD5]/10 shadow-[0_0_15px_rgba(0,255,213,0.3)]' 
                  : 'border-gray-800 opacity-50 grayscale'
              }`}
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              <User className={`w-8 h-8 ${role === 'student' ? 'text-[#00FFD5]' : 'text-gray-600'}`} />
              <span className={`font-pixel text-[10px] ${role === 'student' ? 'text-[#00FFD5]' : 'text-gray-600'}`}>
                STUDENT
              </span>
            </button>
            <button
              onClick={() => setRole('teacher')}
              className={`flex-1 flex flex-col items-center gap-3 p-4 border-2 transition-all duration-300 ${
                role === 'teacher' 
                  ? 'border-[#FF2DAA] bg-[#FF2DAA]/10 shadow-[0_0_15px_rgba(255,45,170,0.3)]' 
                  : 'border-gray-800 opacity-50 grayscale'
              }`}
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              <GraduationCap className={`w-8 h-8 ${role === 'teacher' ? 'text-[#FF2DAA]' : 'text-gray-600'}`} />
              <span className={`font-pixel text-[10px] ${role === 'teacher' ? 'text-[#FF2DAA]' : 'text-gray-600'}`}>
                TEACHER
              </span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="font-pixel text-[10px] text-gray-500 uppercase">Email Address</label>
              <Terminal className={`w-3 h-3 ${textClass} opacity-50`} />
            </div>
            <div className={`relative group`}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-black border-2 ${borderClass} p-4 text-white font-sans outline-none transition-all duration-300 ${glowClass} focus:bg-white/5`}
                placeholder="USER@ACADEMY.EDU"
                required
              />
              <div className={`absolute inset-0 border border-white/5 pointer-events-none`} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="font-pixel text-[10px] text-gray-500 uppercase">Access Code</label>
              <div className={`w-2 h-2 rounded-full ${bgClass} animate-pulse`} />
            </div>
            <div className={`relative group`}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-black border-2 ${borderClass} p-4 text-white font-sans outline-none transition-all duration-300 ${glowClass} focus:bg-white/5`}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-6 space-y-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{ 
                boxShadow: [
                  `0 0 10px ${accentColor}`,
                  `0 0 25px ${accentColor}`,
                  `0 0 10px ${accentColor}`
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`w-full py-5 font-pixel text-xl text-[#0A0A0F] ${bgClass} transition-colors duration-300 uppercase tracking-widest cursor-pointer`}
              style={{
                clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)'
              }}
            >
              Press Start
            </motion.button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-4 border-2 border-white/10 hover:bg-white/5 text-white font-pixel text-[10px] transition-all flex items-center justify-center gap-3"
              style={{
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
              }}
            >
              <GraduationCap className="w-4 h-4" />
              LOGIN WITH GOOGLE
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="font-pixel text-[8px] text-gray-600 uppercase tracking-widest">
            © 2026 RETRO-EDU SYSTEMS // ALL RIGHTS RESERVED
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center font-pixel text-[#00FFD5]">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
