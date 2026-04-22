"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Square as SquareIcon, 
  Box as CubeIcon, 
  Grid as TableIcon, 
  Divide as DivisionIcon,
  ArrowLeft,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  Timer as TimerIcon,
  BookOpen,
  ExternalLink,
  History as HistoryIcon,
  Home as HomeIcon
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { logMistake } from "@/utils/supabase/queries";


type GameMode = "squares" | "cubes" | "tables" | "division" | null;
type Difficulty = "standard" | "hardcore";

interface Question {
  text: string;
  answer: number;
  mode: GameMode;
  type?: "calculate" | "identify";
  displayValue?: string;
}

interface Attempt {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
}

const QUESTIONS_PER_SESSION = 20;

export default function MathPage() {
  const [mode, setMode] = useState<GameMode>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    fetchUser();
  }, []);

  // Hide Navbar via Body Class
  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && !isGameOver) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, isGameOver]);

  const generateSession = (selectedMode: GameMode) => {
    const shuffle = (array: any[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const newQuestions: Question[] = [];
    const pool: {q: string, a: number, type: string, val: string}[] = [];

    if (selectedMode === "squares") {
      const max = difficulty === "standard" ? 30 : 60;
      for (let n = 1; n <= max; n++) {
        // Standard question: what is n squared?
        pool.push({ q: `${n}² =`, a: n * n, type: "calculate", val: `${n}²` });
        // Identify question: which number squared is n*n?
        if (n > 1) {
          pool.push({ q: `?² =`, a: n, type: "identify", val: (n * n).toString() });
        }
      }
    } else if (selectedMode === "cubes") {
      const max = difficulty === "standard" ? 20 : 40;
      for (let n = 1; n <= max; n++) {
        // Standard question: what is n cubed?
        pool.push({ q: `${n}³ =`, a: n * n * n, type: "calculate", val: `${n}³` });
        // Identify question: which number cubed is n*n*n?
        if (n > 1) {
          pool.push({ q: `?³ =`, a: n, type: "identify", val: (n * n * n).toString() });
        }
      }
    } else if (selectedMode === "tables") {
      const maxN1 = difficulty === "standard" ? 30 : 50;
      const maxN2 = difficulty === "standard" ? 10 : 20;
      for (let n1 = 2; n1 <= maxN1; n1++) {
        for (let n2 = 1; n2 <= maxN2; n2++) {
          pool.push({ q: `${n1} × ${n2}`, a: n1 * n2, type: "calculate", val: `${n1} × ${n2}` });
        }
      }
    }

    shuffle(pool);
    const selectedPool = pool.slice(0, QUESTIONS_PER_SESSION);
    
    return selectedPool.map(item => ({
      text: item.q,
      answer: item.a,
      mode: selectedMode,
      type: item.type as "calculate" | "identify",
      displayValue: item.val
    }));
  };

  const startMode = (newMode: GameMode) => {
    if (newMode === "division") return;
    setMode(newMode);
    /* UI will change to game view */
    const sessionQuestions = generateSession(newMode);
    setQuestions(sessionQuestions);
    setCurrentQuestionIndex(0);
    setAttempts([]);
    setUserInput("");
    setFeedback(null);
    setIsGameOver(false);
    setTime(0);
    setIsActive(true);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGameOver || feedback || userInput === "") return;

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = parseInt(userInput) === currentQ.answer;

    const newAttempt: Attempt = {
      question: currentQ,
      userAnswer: userInput,
      isCorrect
    };

    const updatedAttempts = [...attempts, newAttempt];
    setAttempts(updatedAttempts);
    setFeedback(isCorrect ? "correct" : "incorrect");

    setTimeout(async () => {
      // Log mistake if incorrect
      if (!isCorrect && user) {
        logMistake(user.id, {
          subject: 'math',
          mode: mode || 'unknown',
          question: currentQ.text,
          answer: currentQ.answer.toString()
        });
      }

      if (currentQuestionIndex < QUESTIONS_PER_SESSION - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setUserInput("");
        setFeedback(null);
      } else {
        setIsGameOver(true);
        setIsActive(false);
        setFeedback(null);
        
        // Save to Supabase
        if (user) {
          const score = updatedAttempts.filter(a => a.isCorrect).length;
          const accuracy = Math.round((score / QUESTIONS_PER_SESSION) * 100);

          try {
            await supabase.from('test_results').insert({
              user_id: user.id,
              subject: 'math',
              mode: mode,
              score: score,
              total_questions: QUESTIONS_PER_SESSION,
              time_taken: time,
              accuracy: accuracy
            });

            // Update user profile activity/streak
            const { updateGameStats } = await import("@/utils/supabase/queries");
            await updateGameStats(user.id, { score, total: QUESTIONS_PER_SESSION });
          } catch (err) {
            console.error("Failed to save results:", err);
          }
        }
      }
    }, 600);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (mode && !isGameOver && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, currentQuestionIndex, isGameOver]);

  return (
    <main className={`min-h-screen ${mode && !isGameOver ? 'h-screen' : ''} p-4 md:p-8 relative overflow-hidden bg-background font-sans flex flex-col`}>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className={`max-w-4xl mx-auto relative z-10 w-full ${mode && !isGameOver ? 'flex-1 flex flex-col h-full overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12">
              <div className="space-y-4 text-center">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground">Math <span className="text-blue-500">Master</span></h1>
                <p className="text-slate-400 text-lg font-medium">{QUESTIONS_PER_SESSION} Questions. How fast can you solve them?</p>
                
                <div className="flex flex-col items-center gap-6 mt-8">
                  <Link href="/" className="text-slate-500 hover:text-foreground transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                  </Link>
                  
                  {/* Difficulty Toggle */}
                  <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/10">
                    <button 
                      onClick={() => setDifficulty("standard")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${difficulty === "standard" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-foreground"}`}
                    >
                      STANDARD
                    </button>
                    <button 
                      onClick={() => setDifficulty("hardcore")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${difficulty === "hardcore" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-foreground"}`}
                    >
                      HARDCORE
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <OptionCard title="Squares" desc={difficulty === "standard" ? "1-30" : "1-60"} icon={<SquareIcon />} color="status-answered" onClick={() => startMode("squares")} />
                <OptionCard title="Cubes" desc={difficulty === "standard" ? "1-20" : "1-40"} icon={<CubeIcon />} color="status-marked" onClick={() => startMode("cubes")} />
                <OptionCard title="Tables" desc={difficulty === "standard" ? "Up to 30" : "Up to 50"} icon={<TableIcon />} color="status-unanswered" onClick={() => startMode("tables")} />
                <OptionCard title="Division" desc="Coming Soon" icon={<DivisionIcon />} color="slate-500" disabled />
              </div>
            </motion.div>
          ) : isGameOver ? (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="text-center space-y-4 mb-12">
                  <div className="relative inline-block">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-2 -right-8 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg"
                    >
                      <CheckCircle2 className="w-3 h-3" /> SAVED
                    </motion.div>
                  </div>
                  <h2 className="text-4xl font-black text-foreground">Session Complete!</h2>
                  <div className="flex justify-center gap-8 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    <span>Time: <span className="text-foreground">{formatTime(time)}</span></span>
                    <span>Accuracy: <span className="text-foreground">{Math.round((attempts.filter(a => a.isCorrect).length / (attempts.length || 1)) * 100)}%</span></span>
                  </div>
                </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass p-6 rounded-3xl border border-white/10 space-y-4 overflow-y-auto max-h-[400px]">
                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                       <HistoryIcon className="w-5 h-5 text-blue-500" /> Session History
                    </h3>
                    <div className="space-y-3">
                      {attempts.map((attempt, i) => (
                        <div key={i} className={`flex justify-between items-center p-4 rounded-2xl ${attempt.isCorrect ? 'bg-status-answered/5' : 'bg-status-unanswered/5 border border-status-unanswered/20'}`}>
                          <div className="font-bold text-lg text-foreground">{attempt.question.text}</div>
                          <div className="flex items-center gap-4">
                            {!attempt.isCorrect && <span className="text-xs line-through text-slate-500">{attempt.userAnswer}</span>}
                            <span className={`font-black ${attempt.isCorrect ? 'text-status-answered' : 'text-status-unanswered'}`}>
                              {attempt.question.answer}
                            </span>
                            {attempt.isCorrect ? <CheckCircle2 className="w-4 h-4 text-status-answered" /> : <XCircle className="w-4 h-4 text-status-unanswered" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-white/10 space-y-6">
                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                       <BookOpen className="w-5 h-5 text-purple-500" /> Study Resources
                    </h3>
                    <div className="space-y-4">
                       <ResourceItem title={`${mode?.charAt(0).toUpperCase()}${mode?.slice(1)} Reference`} link={`https://www.google.com/search?q=${mode}+table+1+to+30`} />
                        <div className="p-4 bg-white/10 dark:bg-white/5 rounded-2xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed border border-white/10">
                           💡 <span className="font-bold text-slate-900 dark:text-white">Pro Tip:</span> Constant repetition is key to mental math. Try focusing on the ones you missed in this session.
                        </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setMode(null)} className="flex-1 py-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-blue-500/20 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest transition-all shadow-sm">
                        Play Again
                      </button>
                      <Link href="/" className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                        <HomeIcon className="w-4 h-4" /> Home
                      </Link>
                    </div>
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full space-y-6">
              {/* Top Timer & Progress */}
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setMode(null)} className="text-slate-500 hover:text-white transition-colors"><ArrowLeft /></button>
                <div className="flex items-center gap-4 glass px-6 py-2 rounded-full border border-white/10">
                  <div className="flex items-center gap-2 text-blue-400 font-black">
                    <TimerIcon className="w-4 h-4" /> {formatTime(time)}
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Question {currentQuestionIndex + 1} / {QUESTIONS_PER_SESSION}
                  </div>
                </div>
                <div className="w-8" />
              </div>

              {/* Question Display Area */}
              <div className="flex flex-col items-center justify-center flex-1 gap-8 py-4">
                <motion.div 
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <motion.span 
                    layout
                    className={`${questions[currentQuestionIndex]?.type === "identify" ? "text-blue-500 text-xl" : "text-slate-500 text-sm"} font-black uppercase tracking-[0.3em] mb-2 block`}
                  >
                    {questions[currentQuestionIndex]?.text}
                  </motion.span>
                  
                  <div className="text-7xl md:text-9xl font-black text-foreground tracking-tighter tabular-nums">
                    {questions[currentQuestionIndex]?.displayValue}
                  </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={userInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^[0-9]+$/.test(val)) {
                        setUserInput(val);
                      }
                    }}
                    placeholder="Type answer..."
                    className={`w-full bg-white/5 border-2 rounded-2xl px-6 py-4 text-3xl font-black text-center text-foreground focus:outline-none transition-all ${
                      feedback === "correct" ? "border-status-answered" : 
                      feedback === "incorrect" ? "border-status-unanswered" : "border-white/10 focus:border-blue-500"
                    }`}
                  />
                  <button type="submit" className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-95">
                    Submit
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function OptionCard({ title, desc, icon, color, onClick, disabled }: { title: string; desc: string; icon: React.ReactNode; color: string; onClick?: () => void; disabled?: boolean; }) {
  const colorMap: Record<string, string> = {
    'status-answered': 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
    'status-marked': 'text-purple-500 border-purple-500/20 bg-purple-500/5',
    'status-unanswered': 'text-rose-500 border-rose-500/20 bg-rose-500/5',
  };

  const colorClasses = colorMap[color] || 'text-blue-500 border-blue-500/20 bg-blue-500/5';

  return (
    <motion.div whileHover={!disabled ? { y: -5, scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}} onClick={onClick} className={`p-8 rounded-4xl border relative overflow-hidden cursor-pointer transition-all ${disabled ? "bg-slate-900/40 border-white/5 grayscale" : "glass border-white/10 hover:border-white/20 group"}`}>
      <div className={`p-4 rounded-xl mb-4 w-fit border transition-all duration-500 group-hover:scale-110 ${colorClasses}`}>{icon}</div>
      <h3 className="text-2xl font-black text-foreground">{title}</h3>
      <p className="text-slate-500 font-bold text-sm tracking-tight">{desc}</p>
    </motion.div>
  );
}

function ResourceItem({ title, link }: { title: string; link: string; }) {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
      <span className="font-bold text-foreground">{title}</span>
      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" />
    </a>
  );
}
