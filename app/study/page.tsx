'use client';

import { useState, useEffect } from 'react';
import { Heart, Zap, Loader2, GraduationCap } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fsrs, createEmptyCard, Rating, State } from 'ts-fsrs';
import { GoogleGenAI, Type } from '@google/genai';

// Mock data fallback
const MOCK_CARDS = [
  {
    id: 'mock-1',
    question_type: 'vocabulary',
    vocabulary_word: "Ephemeral",
    definition: "Lasting for a very short time.",
    passage: null
  },
  {
    id: 'mock-2',
    question_type: 'grammar',
    vocabulary_word: "She don't like apples.",
    definition: "She doesn't like apples.",
    passage: null
  },
  {
    id: 'mock-3',
    question_type: 'reading',
    vocabulary_word: "Why did the author feel melancholic?",
    definition: "Because the old house was being torn down.",
    passage: "The old house stood at the corner of the street for a century. Today, the bulldozers arrived. I watched from afar, feeling a deep sense of melancholy as the walls crumbled."
  }
];

export default function StudyPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [showDefinition, setShowDefinition] = useState(false);
  
  // ASAG State
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ score?: number, feedback?: string, error?: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Data state
  const [user, setUser] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [cardStats, setCardStats] = useState<{ d: number, s: number, r: number } | null>(null);

  // Google Classroom Integration
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isPassingBack, setIsPassingBack] = useState(false);
  const [passbackStatus, setPassbackStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    checkAuth();
    checkGoogleConnection();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (err) {}
  };

  const checkGoogleConnection = async () => {
    try {
      const res = await fetch('/api/classroom/courses');
      if (res.ok) {
        setIsGoogleConnected(true);
      }
    } catch (err) {}
  };

  const handleGoogleConnect = () => {
    window.open('/api/auth/google/url', 'google_oauth', 'width=600,height=700');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsGoogleConnected(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePassback = async () => {
    if (!isGoogleConnected) return;
    setIsPassingBack(true);
    try {
      const courseId = prompt("Enter Google Course ID:");
      const courseWorkId = prompt("Enter CourseWork (Assignment) ID:");
      
      if (!courseId || !courseWorkId) {
        setIsPassingBack(false);
        return;
      }

      const res = await fetch('/api/classroom/passback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseWorkId,
          score: Math.round((score / (cards.length * 100)) * 100), // Percentage
          studentGoogleId: 'me'
        }),
      });

      if (res.ok) {
        setPassbackStatus('success');
      } else {
        setPassbackStatus('error');
      }
    } catch (err) {
      setPassbackStatus('error');
    } finally {
      setIsPassingBack(false);
    }
  };

  useEffect(() => {
    async function loadCards() {
      if (!isSupabaseConfigured) {
        setCards(MOCK_CARDS);
        setIsLoading(false);
        return;
      }

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const classId = searchParams.get('classId');

        let cardsData;
        if (classId) {
          const { data: joinData, error: joinError } = await supabase
            .from('class_cards')
            .select('*, cards(*)')
            .eq('class_id', classId);
          
          if (joinError) throw joinError;
          cardsData = joinData?.map(j => j.cards).filter(Boolean) || [];
        } else {
          const { data, error } = await supabase.from('cards').select('*');
          if (error) throw error;
          cardsData = data || [];
        }
        
        if (cardsData && cardsData.length > 0) {
          const { data: logsData } = await supabase
            .from('review_logs')
            .select('*')
            .order('reviewed_at', { ascending: false });

          const latestLogs = new Map();
          if (logsData) {
            logsData.forEach(log => {
              if (!latestLogs.has(log.card_id)) {
                latestLogs.set(log.card_id, log);
              }
            });
          }

          const now = new Date();
          const sortedCards = [...cardsData].sort((a, b) => {
            const logA = latestLogs.get(a.id);
            const logB = latestLogs.get(b.id);
            
            const getR = (log: any) => {
              if (!log) return 1.0;
              const elapsed_days = Math.max(0, (now.getTime() - new Date(log.reviewed_at).getTime()) / 86400000);
              return Math.exp(Math.log(0.9) * elapsed_days / log.stability);
            };

            return getR(logA) - getR(logB);
          });

          const topCards = sortedCards.slice(0, 15);
          for (let i = topCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [topCards[i], topCards[j]] = [topCards[j], topCards[i]];
          }

          setCards(topCards);
        } else {
          setCards(MOCK_CARDS);
        }
      } catch (err) {
        setCards(MOCK_CARDS);
      } finally {
        setIsLoading(false);
      }
    }
    loadCards();
  }, []);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    async function fetchCardStats() {
      if (!currentCard || !isSupabaseConfigured || currentCard.id.toString().startsWith('mock-')) {
        setCardStats({ d: 0, s: 0, r: 1 });
        return;
      }
      try {
        const { data: previousLogs } = await supabase
          .from('review_logs')
          .select('*')
          .eq('card_id', currentCard.id)
          .order('reviewed_at', { ascending: false })
          .limit(1);

        if (previousLogs && previousLogs.length > 0) {
          const lastLog = previousLogs[0];
          const now = new Date();
          const last_review = new Date(lastLog.reviewed_at);
          const elapsed_days = Math.max(0, (now.getTime() - last_review.getTime()) / 86400000);
          const r = Math.exp(Math.log(0.9) * elapsed_days / lastLog.stability);
          
          setCardStats({
            d: lastLog.difficulty,
            s: lastLog.stability,
            r: r
          });
        } else {
          setCardStats({ d: 0, s: 0, r: 1 });
        }
      } catch (err) {
        setCardStats({ d: 0, s: 0, r: 1 });
      }
    }
    fetchCardStats();
  }, [currentIndex, currentCard]);

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleReveal = () => {
    setShowDefinition(true);
  };

  const handleGrade = async () => {
    if (!studentAnswer.trim()) return;
    setIsGrading(true);
    try {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Grade the student's short answer based on the reference answer.
        Passage: ${currentCard.passage || 'N/A'}
        Question: ${currentCard.vocabulary_word || currentCard.word}
        Reference Answer: ${currentCard.definition}
        Student Answer: ${studentAnswer}
        
        Provide a score from 0 to 4 (4 being perfect) and a brief feedback string explaining the score. 
        IMPORTANT: Write the feedback directly to the student (e.g., "You made a good point about...", "Your answer is missing...").`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.NUMBER,
                description: "Score from 0 to 4"
              },
              feedback: {
                type: Type.STRING,
                description: "Brief feedback explaining the score"
              }
            },
            required: ["score", "feedback"]
          }
        }
      });

      let text = response.text || '{}';
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      const data = JSON.parse(text);
      if (data.score !== undefined) {
        data.score = Number(data.score);
      }
      
      setGradeResult(data);
      setShowDefinition(true);
    } catch (err: any) {
      console.error(err);
      setGradeResult({ error: err.message || "Error grading." });
      setShowDefinition(true);
    } finally {
      setIsGrading(false);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    if (correct) {
      setScore(prev => prev + (100 * combo));
      setCombo(prev => prev + 1);
    } else {
      setHealth(prev => Math.max(0, prev - 1));
      setCombo(1);
    }
    
    const isDead = !correct && health <= 1;

    try {
      let cardState = createEmptyCard();
      const now = new Date();
      let retrievability = 1.0;

      if (currentCard && !currentCard.id.toString().startsWith('mock-')) {
        const { data: previousLogs } = await supabase
          .from('review_logs')
          .select('*')
          .eq('card_id', currentCard.id)
          .order('reviewed_at', { ascending: false })
          .limit(1);

        if (previousLogs && previousLogs.length > 0) {
          const lastLog = previousLogs[0];
          cardState.stability = lastLog.stability;
          cardState.difficulty = lastLog.difficulty;
          cardState.state = State.Review;
          cardState.last_review = new Date(lastLog.reviewed_at);
          
          const elapsed_days = Math.max(0, (now.getTime() - cardState.last_review.getTime()) / 86400000);
          retrievability = Math.exp(Math.log(0.9) * elapsed_days / cardState.stability);
        }
      }

      let fParams = {};
      const savedSettings = localStorage.getItem('fsrs_settings');
      if (savedSettings) {
        try {
          fParams = JSON.parse(savedSettings);
        } catch (e) {}
      }
      const f = fsrs(fParams);
      const rating = correct ? Rating.Good : Rating.Again;
      const schedulingCards = f.repeat(cardState, now);
      const nextState = schedulingCards[rating].card;

      setCardStats({ d: nextState.difficulty, s: nextState.stability, r: 1.0 });

      if (currentCard && !currentCard.id.toString().startsWith('mock-') && user) {
        await supabase.from('review_logs').insert({
          student_id: user.id,
          card_id: currentCard.id,
          stability: nextState.stability,
          retrievability: retrievability,
          difficulty: nextState.difficulty
        });
      }
    } catch (err) {}

    setTimeout(() => {
      if (isDead) {
        setIsGameOver(true);
      } else if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowDefinition(false);
      } else {
        setIsGameOver(true);
      }
      setStudentAnswer('');
      setGradeResult(null);
      setIsTransitioning(false);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="w-12 h-12 text-[#00FFD5] animate-spin" />
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,213,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,213,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />
        
        <div className="text-center space-y-12 z-10">
          <div className="space-y-4">
            <h1 className="font-pixel text-4xl md:text-6xl text-[#00FFD5] drop-shadow-[0_0_10px_rgba(0,255,213,0.8)] leading-tight">
              VOCAB<br/>ARCADE
            </h1>
            <p className="text-[#FF2DAA] font-pixel text-sm md:text-base tracking-widest">
              INSERT COIN TO PLAY
            </p>
          </div>

          <button 
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-pixel text-xl text-[#0A0A0F] bg-[#00FFD5] hover:bg-white transition-colors duration-200 uppercase tracking-wider cursor-pointer"
            style={{
              boxShadow: '0 0 20px rgba(0,255,213,0.6), inset 0 0 10px rgba(255,255,255,0.5)',
              clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)'
            }}
          >
            Press Start
          </button>

          {!isGoogleConnected && (
            <div className="mt-8">
              <button 
                onClick={handleGoogleConnect}
                className="font-pixel text-[10px] text-[#4285F4] hover:text-white transition-colors flex items-center gap-2 mx-auto"
              >
                <GraduationCap className="w-4 h-4" />
                LOGIN WITH GOOGLE CLASSROOM FOR GRADE SYNC
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#0A0A0F]">
        <div className="text-center space-y-8 z-10">
          <h1 className="font-pixel text-5xl text-[#FF2DAA] drop-shadow-[0_0_10px_rgba(255,45,170,0.8)]">
            {health <= 0 ? 'GAME OVER' : 'STAGE CLEAR'}
          </h1>
          <div className="font-pixel text-2xl text-[#00FFD5]">
            FINAL SCORE: {score.toString().padStart(6, '0')}
          </div>

          {isGoogleConnected && (
            <button 
              onClick={handlePassback}
              disabled={isPassingBack || passbackStatus === 'success'}
              className="px-8 py-4 font-pixel text-sm text-white bg-[#4285F4] hover:bg-white hover:text-[#4285F4] transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
              style={{ clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)' }}
            >
              <GraduationCap className="w-5 h-5" />
              {isPassingBack ? 'SYNCING...' : passbackStatus === 'success' ? 'GRADES SYNCED!' : 'SYNC TO CLASSROOM'}
            </button>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-4 font-pixel text-lg text-[#0A0A0F] bg-[#00FFD5] hover:bg-white transition-colors uppercase cursor-pointer"
            style={{ clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)' }}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative border-x border-[#00FFD5]/20 bg-[#0A0A0F] shadow-[0_0_50px_rgba(0,255,213,0.1)]">
      <header className="flex items-center justify-between p-4 border-b-2 border-[#FF2DAA] bg-[#0A0A0F]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex gap-1">
          {[1, 2, 3].map((h) => (
            <Heart 
              key={h} 
              className={`w-6 h-6 ${h <= health ? 'fill-[#FF2DAA] text-[#FF2DAA] drop-shadow-[0_0_5px_rgba(255,45,170,0.8)]' : 'text-gray-700'}`} 
            />
          ))}
        </div>
        
        <div className="flex flex-col items-end">
          <div className="font-pixel text-[#00FFD5] text-sm md:text-base drop-shadow-[0_0_5px_rgba(0,255,213,0.8)]">
            SCORE: {score.toString().padStart(6, '0')}
          </div>
          <div className="flex items-center gap-1 text-[#FF2DAA] font-pixel text-xs mt-1">
            <Zap className="w-3 h-3 fill-[#FF2DAA]" />
            COMBO x{combo}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 justify-center relative">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10 opacity-20" />

        <div className="relative z-20 w-full flex flex-col gap-2">
          <div className="flex justify-between items-end w-full px-1">
            <div className="flex items-center gap-2 font-pixel text-[10px] text-[#FF2DAA] bg-black/50 p-2 border border-gray-800 uppercase">
              {currentCard?.question_type || 'vocabulary'}
            </div>

            {cardStats && (
              <div className={`flex items-center gap-3 font-pixel text-[10px] text-gray-500 bg-black/50 p-2 border transition-all duration-300 ${isTransitioning ? 'border-[#00FFD5] shadow-[0_0_10px_rgba(0,255,213,0.5)] scale-105' : 'border-gray-800'}`}>
                <div className="text-[#00FFD5] border-r border-gray-700 pr-2 hidden sm:block">DSR</div>
                <div className="flex items-center gap-1">
                  <span>D:</span>
                  <span className="text-[#FF2DAA]">{cardStats.d.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>S:</span>
                  <span className="text-[#00FFD5]">{cardStats.s.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>R:</span>
                  <span className="text-white">{(cardStats.r * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          <div className={`w-full aspect-[3/4] max-h-[60vh] bg-[#14141E] border-2 relative overflow-hidden transition-all duration-500 ${showDefinition ? 'border-[#FF2DAA]' : 'border-[#00FFD5]'}`}
               style={{
                 boxShadow: showDefinition 
                   ? '0 0 50px rgba(255,45,170,0.5), inset 0 0 20px rgba(0,0,0,0.8)' 
                   : '0 0 30px rgba(0,255,213,0.15), inset 0 0 20px rgba(0,0,0,0.8)',
                 clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)'
               }}>
            
            <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 transition-colors duration-500 opacity-50 ${showDefinition ? 'border-[#00FFD5]' : 'border-[#FF2DAA]'}`} />
            <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 transition-colors duration-500 opacity-50 ${showDefinition ? 'border-[#00FFD5]' : 'border-[#FF2DAA]'}`} />

            <div key={currentIndex} className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 animate-glitch w-full h-full">
              <div className="absolute inset-0 pointer-events-none opacity-40 z-10" style={{ 
                backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%), linear-gradient(90deg, rgba(255,0,0,0.15), rgba(0,255,0,0.08), rgba(0,0,255,0.15))', 
                backgroundSize: '100% 4px, 6px 100%' 
              }} />
              
              <div className="absolute inset-0 pointer-events-none z-10" style={{
                background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.5) 100%)'
              }} />

              <div className="relative z-20 w-full flex flex-col items-center justify-center">
                {currentCard?.question_type === 'reading' && currentCard?.passage && (
                  <div className="text-sm text-gray-400 mb-6 italic text-left w-full max-h-32 overflow-y-auto mt-8">
                    &quot;{currentCard.passage}&quot;
                  </div>
                )}

                <h2 className={`font-bold text-white mb-8 tracking-tight transition-all duration-500 ${currentCard?.question_type === 'reading' ? 'text-2xl md:text-3xl mt-4' : 'text-4xl md:text-5xl mt-8'} ${showDefinition ? 'scale-95 text-gray-300' : 'scale-100'}`}>
                  {currentCard?.vocabulary_word || currentCard?.word}
                </h2>

                {currentCard?.question_type === 'reading' ? (
                  showDefinition ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-500 ease-out w-full">
                      <div className="p-4 bg-black/40 border-l-2 border-[#00FFD5] text-left">
                        <p className="text-xs text-[#00FFD5] font-pixel mb-2">REFERENCE ANSWER:</p>
                        <p className="text-gray-300">{currentCard?.definition}</p>
                      </div>
                      {gradeResult && (
                        <div className={`p-4 bg-black/40 border-l-2 text-left ${gradeResult.error ? 'border-red-500' : (gradeResult.score !== undefined && gradeResult.score >= 3 ? 'border-[#00FFD5]' : 'border-[#FF2DAA]')}`}>
                          {gradeResult.error ? (
                            <>
                              <p className="text-xs font-pixel mb-2 text-red-500">ERROR</p>
                              <p className="text-gray-300">{gradeResult.error}</p>
                            </>
                          ) : (
                            <>
                              <p className={`text-xs font-pixel mb-2 ${gradeResult.score !== undefined && gradeResult.score >= 3 ? 'text-[#00FFD5]' : 'text-[#FF2DAA]'}`}>
                                SCORE: {gradeResult.score !== undefined ? gradeResult.score : '?'}/4
                              </p>
                              <p className="text-gray-300">{gradeResult.feedback}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full mt-4">
                      <textarea
                        value={studentAnswer}
                        onChange={(e) => setStudentAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full bg-black border-2 border-gray-700 focus:border-[#00FFD5] text-white p-4 font-sans text-sm outline-none transition-colors min-h-[100px] resize-y"
                      />
                    </div>
                  )
                ) : (
                  showDefinition ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-500 ease-out">
                      <p className="text-xl text-gray-300 leading-relaxed">
                        {currentCard?.definition}
                      </p>
                      {currentCard?.example && (
                        <div className="p-4 bg-black/40 border-l-2 border-[#00FFD5] text-left">
                          <p className="text-gray-400 italic">
                            &quot;{currentCard.example}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[#00FFD5]/50 font-pixel text-xs animate-pulse mt-12">
                      TAP REVEAL TO CONTINUE
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 z-20">
          {currentCard?.question_type === 'reading' ? (
            !showDefinition ? (
              <button
                onClick={handleGrade}
                disabled={isGrading || !studentAnswer.trim()}
                className="w-full py-5 font-pixel text-lg text-[#0A0A0F] bg-[#00FFD5] hover:bg-white transition-colors uppercase tracking-widest cursor-pointer disabled:opacity-50"
                style={{
                  boxShadow: '0 0 15px rgba(0,255,213,0.4)',
                  clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)'
                }}
              >
                {isGrading ? 'GRADING...' : 'SUBMIT'}
              </button>
            ) : (
              <button
                onClick={() => {
                  handleAnswer(gradeResult && gradeResult.score !== undefined ? gradeResult.score >= 3 : false);
                }}
                disabled={isTransitioning}
                className="w-full py-5 font-pixel text-lg text-[#0A0A0F] bg-[#00FFD5] hover:bg-white transition-colors uppercase tracking-widest cursor-pointer disabled:opacity-50"
                style={{
                  boxShadow: '0 0 15px rgba(0,255,213,0.4)',
                  clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)'
                }}
              >
                NEXT
              </button>
            )
          ) : (
            !showDefinition ? (
              <button
                onClick={handleReveal}
                className="w-full py-5 font-pixel text-lg text-[#0A0A0F] bg-[#00FFD5] hover:bg-white transition-colors uppercase tracking-widest cursor-pointer"
                style={{
                  boxShadow: '0 0 15px rgba(0,255,213,0.4)',
                  clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)'
                }}
              >
                Reveal
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer(false)}
                  disabled={isTransitioning}
                  className="py-4 font-pixel text-sm text-white bg-transparent border-2 border-[#FF2DAA] hover:bg-[#FF2DAA]/20 transition-colors uppercase cursor-pointer disabled:opacity-50"
                  style={{
                    boxShadow: '0 0 10px rgba(255,45,170,0.2)',
                    clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 20px)'
                  }}
                >
                  Miss
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  disabled={isTransitioning}
                  className="py-4 font-pixel text-sm text-[#0A0A0F] bg-[#00FFD5] hover:bg-white transition-colors uppercase cursor-pointer disabled:opacity-50"
                  style={{
                    boxShadow: '0 0 15px rgba(0,255,213,0.4)',
                    clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)'
                  }}
                >
                  Hit!
                </button>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
