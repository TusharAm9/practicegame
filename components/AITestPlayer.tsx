
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Timer as TimerIcon,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Brain,
  History,
  Home as HomeIcon,
  BookOpen,
  Send,
  Flag
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { logMistake } from "@/utils/supabase/queries";
import Link from "next/link";

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface AITestPlayerProps {
  test: {
    id: string;
    title: string;
    subject: string;
    questions: Question[];
  };
  onExit: () => void;
}

export default function AITestPlayer({ test, onExit }: AITestPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSelections, setUserSelections] = useState<(number | null)[]>(new Array(test.questions.length).fill(null));
  const [markedForReview, setMarkedForReview] = useState<boolean[]>(new Array(test.questions.length).fill(false));
  const [visited, setVisited] = useState<boolean[]>(() => {
    const v = new Array(test.questions.length).fill(false);
    v[0] = true;
    return v;
  });
  
  const [isGameOver, setIsGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase.auth]);

  // Hide Navbar via Body Class
  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && !isGameOver) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, isGameOver]);

  const handleJump = (index: number) => {
    const newVisited = [...visited];
    newVisited[index] = true;
    setVisited(newVisited);
    setCurrentIndex(index);
  };

  const handleSaveAndNext = () => {
    if (currentIndex < test.questions.length - 1) {
      handleJump(currentIndex + 1);
    }
  };

  const toggleMarkForReview = () => {
    const newMarked = [...markedForReview];
    newMarked[currentIndex] = !newMarked[currentIndex];
    setMarkedForReview(newMarked);
  };

  const finishTest = async () => {
    setIsGameOver(true);
    setIsActive(false);

    if (user) {
      const results = test.questions.map((q, idx) => ({
        question: q.question,
        userAnswer: userSelections[idx] !== null ? q.options[userSelections[idx]!] : "Unanswered",
        correctAnswer: q.options[q.answer],
        isCorrect: userSelections[idx] === q.answer
      }));

      // Log individual mistakes
      results.forEach(r => {
        if (!r.isCorrect) {
          logMistake(user.id, { 
            subject: 'ai_test', 
            mode: test.title, 
            question: r.question, 
            answer: r.correctAnswer 
          });
        }
      });

      const score = results.filter(r => r.isCorrect).length;
      await supabase.from('test_results').insert({
        user_id: user.id,
        subject: `AI: ${test.subject}`,
        mode: test.title,
        score: score,
        total_questions: test.questions.length,
        time_taken: time,
        accuracy: Math.round((score / test.questions.length) * 100)
      });

      const { updateGameStats } = await import("@/utils/supabase/queries");
      await updateGameStats(user.id, { score, total: test.questions.length });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isGameOver) {
    const results = test.questions.map((q, idx) => ({
      question: q.question,
      userAnswer: userSelections[idx] !== null ? q.options[userSelections[idx]!] : "Unanswered",
      correctAnswer: q.options[q.answer],
      isCorrect: userSelections[idx] === q.answer,
      explanation: q.explanation
    }));
    const correctCount = results.filter(r => r.isCorrect).length;

    return (
      <main className="fixed inset-0 z-999 p-6 md:p-12 overflow-y-auto bg-background font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="max-w-6xl mx-auto relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="text-center space-y-4 mb-12">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
              <h2 className="text-4xl font-black text-foreground">Performance Report</h2>
              <div className="flex justify-center gap-8 text-slate-400 font-bold uppercase tracking-widest text-xs">
                <span>Total Score: <span className="text-foreground">{correctCount} / {test.questions.length}</span></span>
                <span>Accuracy: <span className="text-foreground">{Math.round((correctCount / test.questions.length) * 100)}%</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass p-8 rounded-3xl border border-white/10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {results.map((r, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${r.isCorrect ? 'bg-status-answered/5 border-status-answered/20' : 'bg-status-unanswered/5 border-status-unanswered/20'}`}>
                    <p className="text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Question {i+1}</p>
                    <p className="text-foreground font-bold text-lg mb-4">{r.question}</p>
                    {!r.isCorrect && user && (
                      <button 
                        onClick={() => logMistake(user.id, { subject: 'ai_test', mode: test.title, question: r.question, answer: r.correctAnswer })}
                        className="hidden" // Internal trigger or manual log if needed, currently AI tests log summary
                      />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Your Answer</p>
                        <p className={r.isCorrect ? "text-status-answered" : "text-status-unanswered"}>{r.userAnswer}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Correct Answer</p>
                        <p className="text-status-answered">{r.correctAnswer}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 italic text-sm text-slate-400">
                      {r.explanation}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
                  <h3 className="text-xl font-black text-foreground">Next Steps</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                      <p className="text-xs text-purple-400 font-bold leading-relaxed">
                        Retake identifying the key patterns you missed to improve by up to 22%.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={onExit} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg">
                       Back to Dashboard
                    </button>
                    <Link href="/" className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-foreground font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                       <HomeIcon className="w-4 h-4" /> Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  const currentQ = test.questions[currentIndex];

  return (
    <main className="fixed inset-0 z-999 p-4 md:p-8 overflow-y-auto bg-background font-sans">
      <div className="max-w-7xl mx-auto h-full flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* Left: Question Content (70%) */}
        <div className="flex-1 flex flex-col min-h-[85vh]">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 glass p-6 rounded-3xl border border-white/10">
            <div className="flex items-center gap-3">
               <Brain className="w-5 h-5 text-blue-500" />
               <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{test.subject} Vault</span>
            </div>
            
            <button onClick={onExit} className="text-slate-500 hover:text-rose-500 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Question Box */}
          <div className="flex-1 glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 flex flex-col relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
            
            <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pr-4 custom-scrollbar min-h-0">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full">
                   Q{currentIndex + 1}
                </span>
                {markedForReview[currentIndex] && (
                  <span className="bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <Flag className="w-3 h-3" /> MARKED
                  </span>
                )}
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed mb-12">
                {currentQ.question}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {currentQ.options.map((option, index) => {
                  const isSelected = userSelections[currentIndex] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        const newSelections = [...userSelections];
                        newSelections[currentIndex] = index;
                        setUserSelections(newSelections);
                      }}
                      className={`group p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                        isSelected 
                          ? "border-blue-500 bg-blue-500/10 text-blue-500" 
                          : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 text-slate-400 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-black text-xs transition-all ${
                          isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-white/10 group-hover:border-white/30"
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-lg">{option}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 p-1 transition-all ${isSelected ? "border-blue-500" : "border-white/10"}`}>
                        {isSelected && <div className="w-full h-full bg-blue-500 rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-12 flex flex-wrap gap-4 items-center justify-between border-t border-white/10 pt-8">
               <div className="flex gap-4">
                 <button 
                   onClick={() => handleJump(Math.max(0, currentIndex - 1))}
                   disabled={currentIndex === 0}
                   className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                 >
                   <ChevronLeft className="w-6 h-6" />
                 </button>
                 <button 
                  onClick={toggleMarkForReview}
                  className={`px-6 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${
                    markedForReview[currentIndex] 
                      ? "bg-purple-500 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-purple-400"
                  }`}
                 >
                   <Flag className="w-4 h-4" /> Mark for Review
                 </button>
               </div>

               <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const newSelections = [...userSelections];
                      newSelections[currentIndex] = null;
                      setUserSelections(newSelections);
                    }}
                    className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-500 hover:text-rose-500 font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Clear Response
                  </button>
                  <button 
                    onClick={handleSaveAndNext}
                    disabled={currentIndex === test.questions.length - 1}
                    className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-30 disabled:shadow-none"
                  >
                    Save & Next
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Question Palette (30%) */}
        <div className="w-full lg:w-[350px] space-y-6">
           <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-8 flex flex-col h-full sticky top-8">
              {/* Timer & Palette Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Remaining</span>
                  <div className="flex items-center gap-2 text-blue-500 font-black text-lg">
                    <TimerIcon className="w-4 h-4" /> {formatTime(time)}
                  </div>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h4 className="text-xl font-black text-foreground">Question Palette</h4>
                  <div className="h-1 w-12 bg-blue-500 rounded-full" />
                </div>
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-5 h-5 rounded bg-slate-800 border border-white/10" /> Not Visited
                </div>
                <div className="flex items-center gap-2 text-rose-500">
                  <div className="w-5 h-5 rounded bg-rose-500" /> Not Answered
                </div>
                <div className="flex items-center gap-2 text-emerald-500">
                  <div className="w-5 h-5 rounded bg-emerald-500" /> Answered
                </div>
                <div className="flex items-center gap-2 text-purple-500">
                   <div className="w-5 h-5 rounded bg-purple-500" /> For Review
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-5 gap-3">
                  {test.questions.map((_, idx) => {
                    const isSelected = currentIndex === idx;
                    const isAnswered = userSelections[idx] !== null;
                    const isMarked = markedForReview[idx];
                    const isVisited = visited[idx];

                    let statusStyle = "bg-slate-800 border-white/10 text-slate-500";
                    if (isMarked) {
                      statusStyle = "bg-purple-500 border-purple-400 text-white";
                    } else if (isAnswered) {
                      statusStyle = "bg-emerald-500 border-emerald-400 text-white";
                    } else if (isVisited) {
                      statusStyle = "bg-rose-500 border-rose-400 text-white";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleJump(idx)}
                        className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all ${statusStyle} ${
                          isSelected ? "ring-4 ring-blue-500/30 scale-110 z-10" : "hover:scale-105"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={finishTest}
                className="w-full py-5 rounded-4xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Test
              </button>
           </div>
        </div>
      </div>
    </main>
  );
}
