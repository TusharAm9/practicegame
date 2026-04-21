"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  Trash2, 
  Play, 
  ArrowLeft, 
  Brain, 
  Target, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function MistakeVault() {
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchMistakes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data, error } = await supabase
        .from('user_mistakes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('last_missed_at', { ascending: false });

      if (!error && data) {
        setMistakes(data);
      }
      setLoading(false);
    };

    fetchMistakes();
  }, [supabase, router]);

  const removeMistake = async (id: string) => {
    const { error } = await supabase
      .from('user_mistakes')
      .delete()
      .eq('id', id);

    if (!error) {
      setMistakes(mistakes.filter(m => m.id !== id));
    }
  };

  const clearAllMistakes = async () => {
      if (!user) return;
      if (!confirm("Are you sure you want to clear your entire mistake vault?")) return;
      
      const { error } = await supabase
        .from('user_mistakes')
        .delete()
        .eq('user_id', user.id);

      if (!error) {
          setMistakes([]);
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-12 lg:p-20 relative overflow-hidden bg-background font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-foreground transition-colors group mb-4">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-black uppercase tracking-widest text-[10px]">Back to Dashboard</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">
              Mistake <span className="text-blue-500">Vault</span>
            </h1>
            <p className="text-slate-400 font-medium">Review and conquer the questions that challenged you.</p>
          </div>

          <div className="flex items-center gap-4">
             {mistakes.length > 0 && (
                <button 
                  onClick={clearAllMistakes}
                  className="px-6 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-rose-500/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Clear Vault
                </button>
             )}
             <Link href="/math" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20">
                <Play className="w-4 h-4 fill-white" /> Start Practice
             </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {mistakes.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-center space-y-6 glass rounded-[3rem] border-2 border-dashed border-white/5">
                   <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                     <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                   </div>
                   <div className="space-y-1">
                     <h3 className="text-2xl font-black text-foreground">Vault Empty!</h3>
                     <p className="text-slate-500 font-medium">You've mastered everything. Keep it up!</p>
                   </div>
                </motion.div>
              ) : (
                mistakes.map((mistake) => (
                  <motion.div 
                    key={mistake.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass p-8 rounded-4xl border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-4 mb-6">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                            {mistake.subject} • {mistake.mode.replace('_', ' ')}
                          </span>
                          <p className="text-xs text-slate-500 font-bold mt-2">
                             Missed on {new Date(mistake.last_missed_at).toLocaleDateString()}
                          </p>
                       </div>
                       <button 
                        onClick={() => removeMistake(mistake.id)}
                        className="p-3 rounded-xl bg-white/5 text-slate-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xl font-bold text-foreground leading-relaxed">
                         {mistake.question_data}
                       </h3>
                       <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Correct Answer</p>
                          <p className="text-lg font-black text-emerald-500">{mistake.correct_answer}</p>
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
             <div className="glass p-8 rounded-[2.5rem] border border-white/10 sticky top-12 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" /> Improvement Hub
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    Reviewing your mistakes is the fastest way to improve your score. Practice these daily.
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                      <span className="text-xs font-black text-slate-500 uppercase">Pending Review</span>
                      <span className="text-xl font-black text-blue-500">{mistakes.length}</span>
                   </div>
                   <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-bold leading-relaxed italic">
                      💡 Pro Tip: Don't just memorize the answer. Try to understand the logic behind the solution!
                   </div>
                </div>

                <div className="space-y-3 pt-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quick Resources</h4>
                   <Link href="/math" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold text-foreground">
                      <span>Math Tables Reference</span>
                      <BookOpen className="w-4 h-4 text-slate-500" />
                   </Link>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
