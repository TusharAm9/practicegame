"use client";

import Link from "next/link";
import { 
  Calculator, 
  Globe, 
  Languages, 
  Brain,
  ChevronRight,
  Sun,
  CloudSun,
  Moon,
  Trophy,
  Target
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getUserWeaknesses } from "@/utils/supabase/queries";
import { MasteryTracker } from "@/components/MasteryTracker";

export default function Home() {
  const [greeting, setGreeting] = useState("Hello");
  const [userName, setUserName] = useState("Partner");
  const [icon, setIcon] = useState(<Sun className="w-8 h-8 text-yellow-500" />);
  const [weaknesses, setWeaknesses] = useState<any>(null);
  const [loadingWeaknesses, setLoadingWeaknesses] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      setGreeting("Good Morning");
      setIcon(<Sun className="w-8 h-8 text-orange-400" />);
    } else if (hours >= 12 && hours < 17) {
      setGreeting("Good Noon");
      setIcon(<CloudSun className="w-8 h-8 text-yellow-500" />);
    } else {
      setGreeting("Good Evening");
      setIcon(<Moon className="w-8 h-8 text-indigo-400" />);
    }

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name?.split(' ')[0] || "Tushar");
        
        // Fetch weaknesses for adaptive insights
        const mastery = await getUserWeaknesses(session.user.id);
        setWeaknesses(mastery);
      }
      setLoadingWeaknesses(false);
    };
    fetchUser();
  }, [supabase]);

  return (
    <main className="min-h-screen p-6 md:p-8 relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <header className="mb-8 space-y-2">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
               {icon}
            </div>
            <div className="h-px w-12 bg-linear-to-r from-white/20 to-transparent" />
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tight text-foreground">
            {greeting}, <span className="text-blue-500">{userName}</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-2xl max-w-2xl font-medium">
            Ready to master your exams? Choose a subject or warm up with a drill.
          </p>
        </header>

        {/* Performance Insights Section */}
        {!loadingWeaknesses && weaknesses && (
          <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-2 glass p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                <MasteryTracker data={weaknesses} />
             </div>
             <div className="glass p-8 rounded-[3rem] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden h-full flex flex-col justify-center">
                <div className="relative z-10 space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Target className="w-6 h-6" />
                   </div>
                   <h3 className="text-xl font-black text-foreground">Recommended Focus</h3>
                   <p className="text-sm text-slate-400 font-medium leading-relaxed">
                      Based on your recent sessions, we suggest prioritizing 
                      <span className="text-blue-500 font-bold ml-1 uppercase">
                        {Object.entries(weaknesses).sort((a: any, b: any) => a[1].accuracy - b[1].accuracy)[0][0].split(':')[1]}
                      </span> to boost your overall accuracy.
                   </p>
                   <Link href={`/${Object.entries(weaknesses).sort((a: any, b: any) => a[1].accuracy - b[1].accuracy)[0][0].split(':')[0]}`} className="inline-flex items-center gap-2 mt-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest transition-all">
                      Start Targeting <ChevronRight className="w-4 h-4" />
                   </Link>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
             </div>
          </div>
        )}

        {/* Daily Drills Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-widest text-[10px] mb-4 px-1">
            <Trophy className="w-4 h-4 text-yellow-500" /> Recommended Warm-ups
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Link href="/math">
              <div className="glass p-8 rounded-[3rem] border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all flex items-center justify-between gap-6 group h-full">
                <div className="flex items-center gap-6">
                  <div className="p-5 rounded-3xl bg-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform">
                    <Calculator className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Speed Math</h2>
                    <p className="text-slate-400 text-sm font-medium">Squares, cubes, and tables.</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-blue-500 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            <Link href="/alphabet">
              <div className="glass p-8 rounded-[3rem] border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 transition-all flex items-center justify-between gap-6 group h-full">
                <div className="flex items-center gap-6">
                  <div className="p-5 rounded-3xl bg-pink-500/20 text-pink-500 group-hover:scale-110 transition-transform">
                    <Languages className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Alphabet Drill</h2>
                    <p className="text-slate-400 text-sm font-medium">A-Z positions and opposites.</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-pink-500 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SubjectCard 
            title="Math"
            description="Tier-I & II AI mock tests based on your PDFs."
            icon={<Calculator className="w-8 h-8" />}
            href="/tests/math"
            color="#3b82f6"
          />
          <SubjectCard 
            title="GK"
            description="General knowledge and current affairs."
            icon={<Globe className="w-8 h-8" />}
            href="/tests/gk"
            color="#10b981"
          />
          <SubjectCard 
            title="English"
            description="Grammar, vocabulary, and drills."
            icon={<Languages className="w-8 h-8" />}
            href="/tests/english"
            color="#f43f5e"
          />
          <SubjectCard 
            title="Reasoning"
            description="Logical patterns and deductions."
            icon={<Brain className="w-8 h-8" />}
            href="/tests/reasoning"
            color="#a855f7"
          />
        </div>
      </div>
    </main>
  );
}

function SubjectCard({ 
  title, 
  description, 
  icon, 
  href, 
  color, 
  disabled 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  href: string; 
  color: string;
  disabled?: boolean;
}) {
  const CardContent = (
    <div className={`p-6 rounded-4xl border relative overflow-hidden h-full transition-all duration-300 ${
      disabled 
        ? "bg-slate-200/50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 cursor-not-allowed grayscale" 
        : "glass border-white/10 hover:border-white/20 hover:-translate-y-2 hover:shadow-2xl group"
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full blur-2xl opacity-10 transition-opacity" style={{ backgroundColor: color }} />
      
      <div className="p-4 rounded-2xl mb-6 w-fit shadow-inner relative z-10" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>

      <h2 className="text-2xl font-black text-foreground mb-2 relative z-10">{title}</h2>
      <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 relative z-10">{description}</p>
      
      {!disabled && (
        <div className="flex items-center text-xs font-black uppercase tracking-widest text-blue-500">
          Start Training <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
      {disabled && (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Coming Soon</span>
      )}
    </div>
  );

  if (disabled) return CardContent;

  return (
    <Link href={href}>
      {CardContent}
    </Link>
  );
}
