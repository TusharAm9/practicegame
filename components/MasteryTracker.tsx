"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, Target, Zap, ChevronRight } from "lucide-react";

interface MasteryItem {
  key: string;
  topic: string;
  accuracy: number;
  totalQuestions: number;
}

interface MasteryTrackerProps {
  data: Record<string, { total: number, correct: number, accuracy: number }>;
}

export const MasteryTracker = ({ data }: MasteryTrackerProps) => {
  const items = Object.entries(data).map(([key, value]) => {
    // key is "subject:mode" e.g. "AI: Math:Mock Set 1"
    const parts = key.split(':');
    const subjectPart = parts[0];
    const modePart = parts[1] || '';
    const detailPart = parts[2] || '';

    let topic = '';
    if (subjectPart.includes('AI')) {
      // It's an AI test. Format: AI - Subject - Mode
      topic = `AI - ${modePart}${detailPart ? ' - ' + detailPart : ''}`;
    } else {
      // It's a standard drill. Format: Subject - Mode
      topic = `${subjectPart.charAt(0).toUpperCase() + subjectPart.slice(1)} - ${modePart}`;
    }

    return {
      key: key,
      topic: topic,
      accuracy: value.accuracy,
      totalQuestions: value.total
    };
  }).sort((a, b) => a.accuracy - b.accuracy);

  const getHref = (key: string) => {
    const fullKey = key.toLowerCase();
    
    // Check for Math related terms
    if (fullKey.includes('math') || fullKey.includes('quantitative') || fullKey.includes('aptitude') || fullKey.includes('calculator')) {
       return fullKey.includes('ai') ? '/tests/math' : '/math';
    }
    
    // Check for Reasoning related terms
    if (fullKey.includes('reasoning') || fullKey.includes('intelligence') || fullKey.includes('logic') || fullKey.includes('brain')) {
       return '/tests/reasoning';
    }

    // Check for English related terms
    if (fullKey.includes('english') || fullKey.includes('language') || fullKey.includes('alphabet') || fullKey.includes('vocabulary')) {
       return fullKey.includes('ai') ? '/tests/english' : '/alphabet';
    }

    // Check for GK related terms
    if (fullKey.includes('gk') || fullKey.includes('general knowledge') || fullKey.includes('current affairs') || fullKey.includes('globe')) {
       return '/tests/gk';
    }

    return '/';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" /> Topic Mastery
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Strengths & Weaknesses
            </p>
            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase animate-pulse">
              <div className="w-1 h-1 bg-emerald-500 rounded-full" /> Live Sync
            </div>
          </div>
        </div>
        <TrendingUp className="w-6 h-6 text-slate-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <Link key={idx} href={getHref(item.key)}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 hover:bg-white/10 transition-all h-full"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">
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

              <div className="mt-4 flex items-center justify-between">
                {item.accuracy < 50 ? (
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md uppercase tracking-tighter">
                    <Zap className="w-3 h-3" /> Priority Focus
                  </div>
                ) : <div />}
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] font-black text-blue-500 uppercase">
                   Re-Test <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};
