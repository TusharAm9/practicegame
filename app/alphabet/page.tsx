"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Type as AlphabetIcon,
  ArrowLeft,
  Trophy,
  CheckCircle2,
  XCircle,
  Timer as TimerIcon,
  BookOpen,
  ExternalLink,
  History as HistoryIcon,
  Home as HomeIcon,
  Repeat,
  Binary,
  IterationCcw
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { logMistake } from "@/utils/supabase/queries";

type AlphabetMode = "positions" | "letters" | "opposites" | "mixed" | null;

interface Question {
  text: string;
  answer: string | number;
  mode: string;
  type: "position" | "letter" | "opposite";
  displayValue: string;
}

interface Attempt {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
}

const QUESTIONS_PER_SESSION = 20;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function AlphabetPage() {
  const [mode, setMode] = useState<AlphabetMode>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    fetchUser();
  }, []);

  // Hide Navbar
  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && !isGameOver) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, isGameOver]);

  const generateSession = (selectedMode: AlphabetMode) => {
    const pool: Question[] = [];
    
    // Helper to get opposite letter
    const getOpposite = (char: string) => {
      const pos = char.charCodeAt(0) - 64;
      return String.fromCharCode(64 + (27 - pos));
    };

    const addQuestion = (type: "position" | "letter" | "opposite", char: string) => {
      const pos = char.charCodeAt(0) - 64;
      if (type === "position") {
        pool.push({
          text: `Position of "${char}"?`,
          answer: pos,
          mode: selectedMode!,
          type: "position",
          displayValue: char
        });
      } else if (type === "letter") {
        pool.push({
          text: `Letter at ${pos}?`,
          answer: char,
          mode: selectedMode!,
          type: "letter",
          displayValue: pos.toString()
        });
      } else if (type === "opposite") {
        pool.push({
          text: `Opposite of "${char}"?`,
          answer: getOpposite(char),
          mode: selectedMode!,
          type: "opposite",
          displayValue: char
        });
      }
    };

    // Fill pool
    ALPHABET.forEach(char => {
      if (selectedMode === "positions" || selectedMode === "mixed") addQuestion("position", char);
      if (selectedMode === "letters" || selectedMode === "mixed") addQuestion("letter", char);
      if (selectedMode === "opposites" || selectedMode === "mixed") addQuestion("opposite", char);
    });

    const shuffle = (array: any[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    return shuffle(pool).slice(0, QUESTIONS_PER_SESSION);
  };

  const startMode = (newMode: AlphabetMode) => {
    setMode(newMode);
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
    const isCorrect = userInput.trim().toUpperCase() === currentQ.answer.toString().toUpperCase();

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
          subject: 'alphabet',
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
        
        if (user) {
          const score = updatedAttempts.filter(a => a.isCorrect).length;
          const accuracy = Math.round((score / QUESTIONS_PER_SESSION) * 100);
          try {
            await supabase.from('test_results').insert({
              user_id: user.id,
              subject: 'english_drills',
              mode: mode,
              score: score,
              total_questions: QUESTIONS_PER_SESSION,
              time_taken: time,
              accuracy: accuracy
            });
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
    <main className="min-h-screen p-4 md:p-8 lg:p-12 relative overflow-hidden bg-background font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 w-full">
        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12">
              <div className="space-y-4 text-center">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground">Alphabet <span className="text-pink-500">Master</span></h1>
                <p className="text-slate-400 text-lg font-medium">Master A-Z positions and opposites for reasoning speed.</p>
                
                <div className="flex flex-col items-center gap-6 mt-8">
                  <Link href="/" className="text-slate-500 hover:text-foreground transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <OptionCard title="A → 1" desc="Find position of letter" icon={<Binary />} color="rose-500" onClick={() => startMode("positions")} />
                <OptionCard title="1 → A" desc="Find letter at position" icon={<AlphabetIcon />} color="blue-500" onClick={() => startMode("letters")} />
                <OptionCard title="A ↔ Z" desc="Find opposite letter" icon={<Repeat />} color="purple-500" onClick={() => startMode("opposites")} />
                <OptionCard title="Mixed" desc="All types combined" icon={<IterationCcw />} color="emerald-500" onClick={() => startMode("mixed")} />
              </div>
            </motion.div>
          ) : isGameOver ? (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="text-center space-y-4 mb-12">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
                  <h2 className="text-4xl font-black text-foreground">Drill Complete!</h2>
                  <div className="flex justify-center gap-8 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    <span>Time: <span className="text-foreground">{formatTime(time)}</span></span>
                    <span>Accuracy: <span className="text-foreground">{Math.round((attempts.filter(a => a.isCorrect).length / (attempts.length || 1)) * 100)}%</span></span>
                  </div>
                </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass p-6 rounded-3xl border border-white/10 space-y-4 overflow-y-auto max-h-[400px]">
                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                       <HistoryIcon className="w-5 h-5 text-pink-500" /> Session History
                    </h3>
                    <div className="space-y-3">
                      {attempts.map((attempt, i) => (
                        <div key={i} className={`flex justify-between items-center p-4 rounded-2xl ${attempt.isCorrect ? 'bg-emerald-500/5' : 'bg-rose-500/5 border border-rose-500/20'}`}>
                          <div className="font-bold text-lg text-foreground">{attempt.question.text}</div>
                          <div className="flex items-center gap-4">
                            {!attempt.isCorrect && <span className="text-xs line-through text-slate-500">{attempt.userAnswer}</span>}
                            <span className={`font-black ${attempt.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {attempt.question.answer}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-white/10 space-y-6">
                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                       <BookOpen className="w-5 h-5 text-indigo-500" /> Study Tip
                    </h3>
                    <div className="p-4 bg-white/5 rounded-2xl text-sm text-slate-400 leading-relaxed">
                        Learn the "EJOTY" rule (5, 10, 15, 20, 25) to quickly find alphabet positions. Opposite pairs like A-Z, B-Y, C-X are essential for coding-decoding!
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setMode(null)} className="flex-1 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest transition-all">
                        Try Again
                      </button>
                      <Link href="/" className="flex-1 py-4 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <HomeIcon className="w-4 h-4" /> Home
                      </Link>
                    </div>
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setMode(null)} className="text-slate-500 hover:text-white transition-colors"><ArrowLeft /></button>
                <div className="flex items-center gap-4 glass px-6 py-2 rounded-full border border-white/10">
                  <div className="flex items-center gap-2 text-pink-400 font-black">
                    <TimerIcon className="w-4 h-4" /> {formatTime(time)}
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Question {currentQuestionIndex + 1} / {QUESTIONS_PER_SESSION}
                  </div>
                </div>
                <div className="w-8" />
              </div>

              <div className="flex flex-col items-center justify-center min-h-[300px] gap-8">
                <motion.div key={currentQuestionIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                  <span className="text-pink-500 font-black uppercase tracking-[0.3em] text-xl mb-4 block">
                    {questions[currentQuestionIndex]?.text}
                  </span>
                  
                  <div className="relative flex items-center justify-center py-12">
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-48 h-48 bg-pink-600/10 border-4 border-pink-500 rounded-full flex items-center justify-center shadow-[0_0_50px_-12px_rgba(236,72,153,0.5)] relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-pink-500/10 to-transparent" />
                      <div className="text-7xl font-black text-foreground z-10">
                        {questions[currentQuestionIndex]?.displayValue}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type answer..."
                    className={`w-full bg-white/5 border-2 rounded-2xl px-6 py-4 text-3xl font-black text-center text-foreground uppercase focus:outline-none transition-all ${
                      feedback === "correct" ? "border-emerald-500" : 
                      feedback === "incorrect" ? "border-rose-500" : "border-white/10 focus:border-pink-500"
                    }`}
                  />
                  <button type="submit" className="w-full py-4 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-95">
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
  return (
    <motion.div whileHover={!disabled ? { y: -5, scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}} onClick={onClick} className={`p-8 rounded-4xl border relative overflow-hidden cursor-pointer transition-all ${disabled ? "bg-slate-900/40 border-white/5 grayscale" : "glass border-white/10 hover:border-white/20 group"}`}>
      <div className={`p-4 rounded-xl mb-4 w-fit border transition-all duration-500 group-hover:scale-110 text-pink-500 border-pink-500/20 bg-pink-500/5`}>{icon}</div>
      <h3 className="text-2xl font-black text-foreground">{title}</h3>
      <p className="text-slate-500 font-bold text-sm tracking-tight">{desc}</p>
    </motion.div>
  );
}
