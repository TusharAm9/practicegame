
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Clock, FileText, AlertCircle, Library } from "lucide-react";
import AITestPlayer from "./AITestPlayer";

interface SubjectTestListProps {
  tests: any[];
  user: any;
}

export default function SubjectTestList({ tests: initialTests, user }: SubjectTestListProps) {
  const [activeTest, setActiveTest] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (activeTest) {
    return <AITestPlayer test={activeTest} onExit={() => setActiveTest(null)} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {initialTests.length === 0 ? (
          <div className="col-span-full text-center py-20 glass rounded-[2rem] border-2 border-dashed border-white/5 space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-slate-700">
              <Library className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">Vault Empty</h3>
              <p className="text-slate-600 font-medium text-sm">No tests found for this category yet.</p>
            </div>
          </div>
        ) : (
          initialTests.map((test) => (
            <motion.div 
              key={test.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-[2rem] border border-white/10 hover:border-blue-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 blur-2xl rounded-full" />
              
              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> {isMounted ? new Date(test.created_at).toLocaleDateString() : "Loading..."}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                    {test.questions.length} MCQs
                  </span>
                </div>

                <h4 className="text-lg font-bold text-foreground leading-tight group-hover:text-blue-500 transition-colors">
                  {test.title}
                </h4>

                <button 
                  onClick={() => setActiveTest(test)}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" /> Start Practice
                </button>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
