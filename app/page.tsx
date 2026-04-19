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
  Trophy
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [greeting, setGreeting] = useState("Hello");
  const [userName, setUserName] = useState("Partner");
  const [icon, setIcon] = useState(<Sun className="w-8 h-8 text-yellow-500" />);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name?.split(' ')[0] || "Tushar");
      }
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

        {/* Daily Drills Section slice */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-widest text-[10px] mb-4 px-1">
            <Trophy className="w-4 h-4" /> Recommended Warm-up
          </div>
          <Link href="/math">
            <div className="glass p-8 rounded-[3rem] border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
              <div className="flex items-center gap-6">
                <div className="p-5 rounded-3xl bg-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform">
                  <Calculator className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-foreground">Speed Math Challenge</h2>
                  <p className="text-slate-400 font-medium">Drill squares, cubes, and tables to boost your calculation speed.</p>
                </div>
              </div>
              <div className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs group-hover:px-10 transition-all">
                Play Now
              </div>
            </div>
          </Link>
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
    <div className={`p-6 rounded-[2rem] border relative overflow-hidden h-full transition-all duration-300 ${
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
