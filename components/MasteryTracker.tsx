"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Zap } from "lucide-react";

interface MasteryItem {
  topic: string;
  accuracy: number;
  totalQuestions: number;
}

interface MasteryTrackerProps {
  data: Record<string, { total: number, correct: number, accuracy: number }>;
}

export const MasteryTracker = ({ data }: MasteryTrackerProps) => {
  const items = Object.entries(data).map(([key, value]) => ({
    topic: key.replace('math:', '').replace('alphabet:', '').replace('ai_test:', 'AI '),
    accuracy: value.accuracy,
    totalQuestions: value.total
  })).sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" /> Topic Mastery
          </h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Strengths & Weaknesses
          </p>
        </div>
        <TrendingUp className="w-6 h-6 text-slate-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-black text-xs uppercase tracking-widest text-slate-400 group-hover:text-foreground transition-colors">
                {item.topic}
              </span>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                item.accuracy >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 
                item.accuracy >= 50 ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
              }`}>
                {item.accuracy}%
              </span>
            </div>
            
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${item.accuracy}%` }}
                className={`h-full rounded-full ${
                  item.accuracy >= 80 ? 'bg-emerald-500' : 
                  item.accuracy >= 50 ? 'bg-blue-500' : 'bg-rose-500'
                }`}
              />
            </div>

            {item.accuracy < 50 && (
              <div className="mt-3 flex items-center gap-1.5 text-[8px] font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md w-fit uppercase tracking-tighter">
                <Zap className="w-3 h-3" /> Priority Focus
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
