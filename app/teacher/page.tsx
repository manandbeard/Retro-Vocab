'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Loader2, Users, BookOpen, Plus, RefreshCcw, 
  Download, Trash2, LayoutDashboard, Library,
  CheckCircle2, AlertCircle, ChevronRight, Search
} from 'lucide-react';
import Link from 'next/link';
import ContentModal from '@/components/ContentModal';
import AssignModal from '@/components/AssignModal';

type Tab = 'overview' | 'students' | 'content';

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data state
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [googleCourses, setGoogleCourses] = useState<any[]>([]);
  
  // UI state
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [cardToAssign, setCardToAssign] = useState<any>(null);

  useEffect(() => {
    async function loadTeacherData() {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          window.location.href = '/login';
          return;
        }
        const userData = await userRes.json();
        setUser(userData);

        if (userData.role !== 'teacher') {
          window.location.href = '/student';
          return;
        }

        // Fetch DB Classes
        const { data: dbClasses } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', userData.id);
        setClasses(dbClasses || []);

        // Fetch DB Cards
        const { data: dbCards } = await supabase
          .from('cards')
          .select('*')
          .eq('teacher_id', userData.id);
        setCards(dbCards || []);

        // Fetch Google Courses
        const gRes = await fetch('/api/classroom/courses');
        if (gRes.ok) {
          const gData = await gRes.json();
          setGoogleCourses(gData.courses || []);
        }

      } catch (err) {
        console.error('Teacher dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTeacherData();
  }, []);

  const handleSync = async (courseId: string) => {
    setIsSyncing(courseId);
    try {
      const res = await fetch('/api/classroom/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });
      if (res.ok) {
        setSyncStatus({ ...syncStatus, [courseId]: 'success' });
        // Refresh classes
        const { data: dbClasses } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id);
        setClasses(dbClasses || []);
      } else {
        setSyncStatus({ ...syncStatus, [courseId]: 'error' });
      }
    } catch (err) {
      setSyncStatus({ ...syncStatus, [courseId]: 'error' });
    } finally {
      setIsSyncing(null);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    setSelectedClass(classId);
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, users(*)')
      .eq('class_id', classId);
    
    if (enrollments) {
      const studentsWithStats = await Promise.all(enrollments.map(async (e) => {
        const { count } = await supabase
          .from('review_logs')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', e.users.id);
        return { ...e.users, reviewCount: count || 0 };
      }));
      setStudents(studentsWithStats);
    }
  };

  const handleResetData = async (studentId: string) => {
    if (!confirm('Are you sure you want to reset all progress for this student? This cannot be undone.')) return;
    const { error } = await supabase
      .from('review_logs')
      .delete()
      .eq('student_id', studentId);
    
    if (!error) {
      setStudents(students.map(s => s.id === studentId ? { ...s, reviewCount: 0 } : s));
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Remove student from this class?')) return;
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', selectedClass);
    
    if (!error) {
      setStudents(students.filter(s => s.id !== studentId));
    }
  };

  const handleSaveContent = async (formData: any) => {
    try {
      const res = await fetch('/api/teacher/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newCard = await res.json();
        setCards([newCard, ...cards]);
      }
    } catch (err) {
      console.error('Save content error:', err);
    }
  };

  const handleAssignCard = async (classIds: string[]) => {
    if (!cardToAssign) return;
    try {
      const res = await fetch('/api/teacher/content/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: cardToAssign.id,
          classIds
        })
      });
      if (res.ok) {
        setIsAssignModalOpen(false);
        setCardToAssign(null);
        alert('Content assigned successfully!');
      }
    } catch (err) {
      console.error('Assign error:', err);
    }
  };
  const downloadStudentData = () => {
    if (!students.length) return;
    const headers = ['Name', 'Email', 'Google ID', 'Review Count'];
    const rows = students.map(s => [s.name, s.email, s.google_id, s.reviewCount]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${selectedClass}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="w-12 h-12 text-[#00FFD5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#14141E] border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="space-y-1">
          <h2 className="font-pixel text-[#00FFD5] text-lg">TEACHER_OS</h2>
          <p className="text-[10px] text-gray-500 font-mono uppercase">Version 2.0.4-stable</p>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#00FFD5] text-[#0A0A0F]' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-pixel text-[10px] uppercase">Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'students' ? 'bg-[#00FFD5] text-[#0A0A0F]' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-pixel text-[10px] uppercase">Students</span>
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'content' ? 'bg-[#00FFD5] text-[#0A0A0F]' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <Library className="w-5 h-5" />
            <span className="font-pixel text-[10px] uppercase">Content</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF2DAA] flex items-center justify-center font-bold text-xs">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-pixel text-[#00FFD5]">OVERVIEW</h1>
                <p className="text-gray-500 font-mono uppercase tracking-widest">System status and classroom sync</p>
              </header>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-pixel text-xs uppercase text-[#FF2DAA]">Google Classroom Sync</h2>
                    <RefreshCcw className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="space-y-3">
                    {googleCourses.map((course) => {
                      const isSynced = classes.some(c => c.google_course_id === course.id);
                      return (
                        <div key={course.id} className="p-4 bg-[#14141E] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{course.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">ID: {course.id}</p>
                          </div>
                          <button 
                            onClick={() => handleSync(course.id)}
                            disabled={isSyncing === course.id}
                            className={`px-4 py-2 rounded-lg font-pixel text-[10px] transition-all ${
                              isSynced 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : 'bg-[#00FFD5] text-[#0A0A0F] hover:scale-105'
                            }`}
                          >
                            {isSyncing === course.id ? 'SYNCING...' : isSynced ? 'SYNCED' : 'SYNC'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="font-pixel text-xs uppercase text-[#FF2DAA]">Quick Stats</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-[#14141E] border border-white/5 rounded-2xl">
                      <p className="text-[10px] text-gray-500 font-pixel uppercase mb-2">Active Classes</p>
                      <p className="text-3xl font-bold">{classes.length}</p>
                    </div>
                    <div className="p-6 bg-[#14141E] border border-white/5 rounded-2xl">
                      <p className="text-[10px] text-gray-500 font-pixel uppercase mb-2">Library Items</p>
                      <p className="text-3xl font-bold">{cards.length}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex items-end justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-pixel text-[#00FFD5]">STUDENTS</h1>
                  <p className="text-gray-500 font-mono uppercase tracking-widest">Performance analysis and data management</p>
                </div>
                {selectedClass && (
                  <button 
                    onClick={downloadStudentData}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white font-pixel text-[10px] hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOAD CSV
                  </button>
                )}
              </header>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-64 space-y-4">
                  <h2 className="font-pixel text-[10px] text-gray-500 uppercase">Select Class</h2>
                  <div className="flex flex-col gap-2">
                    {classes.map((cls) => (
                      <button 
                        key={cls.id}
                        onClick={() => fetchClassStudents(cls.id)}
                        className={`p-4 text-left rounded-xl border transition-all ${selectedClass === cls.id ? 'bg-[#00FFD5]/10 border-[#00FFD5] text-[#00FFD5]' : 'bg-[#14141E] border-white/5 text-gray-400 hover:border-white/20'}`}
                      >
                        <p className="font-bold text-sm truncate">{cls.class_name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {!selectedClass ? (
                    <div className="h-64 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-gray-600 font-pixel text-xs">
                      SELECT A CLASS TO VIEW STUDENTS
                    </div>
                  ) : (
                    <div className="bg-[#14141E] border border-white/5 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 bg-black/20">
                            <th className="p-4 font-pixel text-[10px] text-gray-500 uppercase">Student</th>
                            <th className="p-4 font-pixel text-[10px] text-gray-500 uppercase">Reviews</th>
                            <th className="p-4 font-pixel text-[10px] text-gray-500 uppercase text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <p className="font-bold">{student.name}</p>
                                <p className="text-[10px] text-gray-500 font-mono">{student.email}</p>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-1 bg-white/5 rounded text-xs font-mono">{student.reviewCount}</span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button 
                                  onClick={() => handleResetData(student.id)}
                                  className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all"
                                  title="Reset Progress"
                                >
                                  <RefreshCcw className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Remove from Class"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex items-end justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-pixel text-[#00FFD5]">CONTENT</h1>
                  <p className="text-gray-500 font-mono uppercase tracking-widest">Library management and assignments</p>
                </div>
                <button 
                  onClick={() => setIsContentModalOpen(true)}
                  className="px-6 py-3 bg-[#00FFD5] text-[#0A0A0F] font-pixel text-[10px] hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  NEW ITEM
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div key={card.id} className="p-6 bg-[#14141E] border border-white/5 rounded-2xl space-y-4 group hover:border-[#00FFD5]/30 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-[#FF2DAA]/10 text-[#FF2DAA] text-[8px] font-pixel uppercase rounded">
                        {card.question_type}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-1 text-gray-400 hover:text-white"><Plus className="w-4 h-4" /></button>
                        <button className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{card.vocabulary_word}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{card.definition}</p>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-gray-600 font-mono italic">
                        {new Date(card.created_at).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={() => {
                          setCardToAssign(card);
                          setIsAssignModalOpen(true);
                        }}
                        className="text-[10px] text-[#00FFD5] font-pixel hover:underline"
                      >
                        ASSIGN
                      </button>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className="col-span-full p-12 border-2 border-dashed border-white/5 rounded-3xl text-center text-gray-500 font-pixel">
                    LIBRARY IS EMPTY
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <ContentModal 
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        onSave={handleSaveContent}
        classes={classes}
      />

      <AssignModal 
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setCardToAssign(null);
        }}
        onAssign={handleAssignCard}
        classes={classes}
        cardName={cardToAssign?.vocabulary_word || ''}
      />
    </div>
  );
}
