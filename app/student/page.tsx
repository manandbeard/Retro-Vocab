'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Loader2, BookOpen, TrendingUp, Award, Clock } from 'lucide-react';
import MasteryHeatmap from '@/components/MasteryHeatmap';
import Link from 'next/link';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [masteryData, setMasteryData] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Get current user (mocking session for now or using a helper)
        // In a real app, we'd use a session hook
        const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('session='));
        if (!sessionCookie) {
          window.location.href = '/login';
          return;
        }

        // For MVP, we'll fetch the user info from a profile endpoint or just query by email if we had it
        // Let's assume we have an endpoint /api/auth/me
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) throw new Error('Not authenticated');
        const userData = await userRes.json();
        setUser(userData);

        if (userData.role !== 'student') {
          window.location.href = '/teacher';
          return;
        }

        // 2. Fetch Stats
        const { data: logs } = await supabase
          .from('review_logs')
          .select('*, cards(vocabulary_word)')
          .eq('student_id', userData.id);

        if (logs) {
          const totalReviews = logs.length;
          const avgRetrievability = logs.reduce((acc, log) => acc + Number(log.retrievability), 0) / (totalReviews || 1);
          const avgDifficulty = logs.reduce((acc, log) => acc + Number(log.difficulty), 0) / (totalReviews || 1);

          setStats({
            totalReviews,
            avgRetrievability: (avgRetrievability * 100).toFixed(1),
            avgDifficulty: avgDifficulty.toFixed(2)
          });

          // Process mastery data for heatmap (latest log per card)
          const latestLogs = new Map();
          logs.forEach(log => {
            if (!latestLogs.has(log.card_id) || new Date(log.reviewed_at) > new Date(latestLogs.get(log.card_id).reviewed_at)) {
              latestLogs.set(log.card_id, log);
            }
          });

          const heatmap = Array.from(latestLogs.values()).map(log => ({
            word: log.cards?.vocabulary_word || 'Unknown',
            mastery: log.retrievability
          }));
          setMasteryData(heatmap);
        }

        // 3. Fetch Classes
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*, classes(*)')
          .eq('student_id', userData.id);
        
        if (enrollments) {
          setClasses(enrollments.map(e => e.classes));
        }

      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="w-12 h-12 text-[#00FFD5] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-pixel text-[#00FFD5] drop-shadow-[0_0_10px_rgba(0,255,213,0.5)]">
              STUDENT_DASHBOARD
            </h1>
            <p className="text-gray-400 font-mono uppercase tracking-widest">
              Welcome back, {user.name} | ID: {user.google_id?.slice(0, 8)}...
            </p>
          </div>
          <Link 
            href="/study"
            className="px-8 py-4 bg-[#FF2DAA] text-white font-pixel text-sm hover:bg-white hover:text-[#FF2DAA] transition-all uppercase tracking-tighter"
            style={{ clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)' }}
          >
            START STUDYING
          </Link>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#14141E] border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#00FFD5]">
              <BookOpen className="w-5 h-5" />
              <span className="font-pixel text-xs uppercase">Total Reviews</span>
            </div>
            <div className="text-4xl font-bold">{stats?.totalReviews || 0}</div>
          </div>
          <div className="p-6 bg-[#14141E] border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#FF2DAA]">
              <TrendingUp className="w-5 h-5" />
              <span className="font-pixel text-xs uppercase">Avg Retrievability</span>
            </div>
            <div className="text-4xl font-bold">{stats?.avgRetrievability || 0}%</div>
          </div>
          <div className="p-6 bg-[#14141E] border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <Award className="w-5 h-5" />
              <span className="font-pixel text-xs uppercase">Avg Difficulty</span>
            </div>
            <div className="text-4xl font-bold">{stats?.avgDifficulty || 0}</div>
          </div>
        </section>

        {/* Mastery Heatmap */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-[#00FFD5]" />
            <h2 className="text-xl font-pixel uppercase tracking-widest">Mastery Heatmap</h2>
          </div>
          <div className="p-8 bg-[#14141E] border border-white/5 rounded-3xl">
            <MasteryHeatmap data={masteryData} />
          </div>
        </section>

        {/* Classes */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-[#FF2DAA]" />
            <h2 className="text-xl font-pixel uppercase tracking-widest">My Classes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="p-6 bg-[#14141E] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[#00FFD5]/30 transition-all">
                <div>
                  <h3 className="text-lg font-bold">{cls.class_name}</h3>
                  <p className="text-xs text-gray-500 font-mono">ID: {cls.google_course_id}</p>
                </div>
                <Link 
                  href={`/study?classId=${cls.id}`}
                  className="p-3 rounded-full bg-white/5 group-hover:bg-[#00FFD5] group-hover:text-[#0A0A0F] transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                </Link>
              </div>
            ))}
            {classes.length === 0 && (
              <div className="col-span-full p-12 border-2 border-dashed border-white/5 rounded-3xl text-center text-gray-500 font-pixel">
                NOT ENROLLED IN ANY CLASSES
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
