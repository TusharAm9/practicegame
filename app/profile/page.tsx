"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { User, Mail, Shield, LogOut, ArrowLeft, Loader2, Calendar, Flame, History, Trophy, Clock, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Get streak from metadata
      const userStreak = user.user_metadata?.streak || 0;
      setStreak(userStreak);

      // Fetch Results
      const { data: testResults } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (testResults) {
        setResults(testResults);
        // Fallback calculation if metadata streak is 0
        if (userStreak === 0) calculateStreak(testResults);
      }

      setLoading(false);
    };
    fetchData();
  }, [router, supabase]);

  const calculateStreak = (data: any[]) => {
    if (data.length === 0) return;

    const dates = data.map(r => new Date(r.created_at).toDateString());
    const uniqueDates = Array.from(new Set(dates));
    
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      setStreak(0);
      return;
    }

    for (let i = 0; i < uniqueDates.length; i++) {
        const d1 = new Date(uniqueDates[i]);
        const d2 = new Date(uniqueDates[i+1]);
        
        currentStreak++;
        
        if (d2) {
            const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
            if (diff > 1.1) break; // Gap larger than 1 day
        }
    }
    setStreak(currentStreak);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || "User";
  const joinedDate = new Date(user?.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen p-4 md:p-12 lg:p-20 bg-background relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-black uppercase tracking-widest text-[10px]">Back to Dashboard</span>
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] border border-red-500/20"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: User Overview */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-6">
            <div className="glass p-8 rounded-[2.5rem] border border-white/10 text-center relative overflow-hidden">
               <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-blue-500 to-purple-500 mx-auto mb-6 flex items-center justify-center shadow-xl">
                 <span className="text-3xl font-black text-white">{fullName.charAt(0).toUpperCase()}</span>
               </div>
               <h2 className="text-xl font-black text-foreground">{fullName}</h2>
               <p className="text-slate-500 font-bold text-xs mb-8">{user?.email}</p>

               <div className="flex bg-orange-500/10 p-4 rounded-2xl items-center justify-between border border-orange-500/20 mb-6">
                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
                    <span className="text-sm font-black text-foreground uppercase tracking-wider">Day Streak</span>
                  </div>
                  <span className="text-2xl font-black text-orange-500">{streak}</span>
               </div>

               <div className="space-y-4 pt-6 border-t border-white/5 text-left">
                  <StatItem icon={<Calendar className="w-4 h-4 text-blue-400" />} label="Joined" value={joinedDate} />
                  <StatItem icon={<Shield className="w-4 h-4 text-green-400" />} label="Status" value="Verified Member" />
               </div>
            </div>
          </motion.div>

          {/* Right: History & Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                  <History className="w-6 h-6 text-blue-500" /> Recent Activity
                </h3>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-slate-500 font-bold">No sessions recorded yet. Start training to see your progress!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4">
                        <th className="pb-4 pl-4">Subject</th>
                        <th className="pb-4">Score</th>
                        <th className="pb-4">Accuracy</th>
                        <th className="pb-4">Time</th>
                        <th className="pb-4 text-right pr-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 8).map((run) => (
                        <tr key={run.id} className="glass rounded-2xl group transition-all hover:bg-white/5">
                          <td className="py-4 pl-4 rounded-l-2xl">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[10px] text-blue-400 uppercase">
                                 {run.mode.charAt(0)}
                               </div>
                               <span className="font-bold text-foreground capitalize">{run.mode}</span>
                             </div>
                          </td>
                          <td className="py-4 font-black text-foreground">{run.score} / {run.total_questions}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${run.accuracy >= 90 ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {run.accuracy}%
                            </span>
                          </td>
                          <td className="py-4 text-slate-400 text-sm font-medium">
                             {Math.floor(run.time_taken / 60)}:{(run.time_taken % 60).toString().padStart(2,'0')}s
                          </td>
                          <td className="py-4 text-right pr-4 rounded-r-2xl text-[10px] font-bold text-slate-500">
                             {new Date(run.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <SummaryCard 
                 icon={<Trophy className="text-yellow-500" />} 
                 label="Average accuracy" 
                 value={`${results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.accuracy, 0) / results.length) : 0}%`} 
               />
               <SummaryCard 
                 icon={<Clock className="text-blue-500" />} 
                 label="Total sessions" 
                 value={results.length} 
               />
               <SummaryCard 
                 icon={<CheckCircle className="text-green-500" />} 
                 label="Best Score" 
                 value={results.length > 0 ? Math.max(...results.map(r => r.score)) : 0} 
               />
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string; }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-white/5">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number; }) {
  return (
    <div className="glass p-6 rounded-3xl border border-white/10 flex items-center gap-4">
      <div className="p-4 rounded-2xl bg-white/5 text-xl">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}
