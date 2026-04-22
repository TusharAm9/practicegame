"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calculator, 
  Brain, 
  Globe, 
  Languages, 
  Flame,
  Zap,
  Target,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2
} from "lucide-react";
import { 
  getStudyTasks, 
  createStudyTask, 
  updateStudyTask, 
  deleteStudyTask, 
  initializeStudyTasks 
} from "@/utils/supabase/study-plan";

interface StudyPlanProps {
  user: any;
  weaknesses: any;
}

interface Task {
  id: string;
  subject: string;
  topic: string;
  is_completed: boolean;
}

const HIGH_YIELD_TOPICS: Record<string, string[]> = {
  Math: ["Speed Math (Squares/Cubes)", "Percentages & Ratios", "Profit & Loss", "Geometry/Trigonometry", "Data Interpretation"],
  GK: ["Current Affairs (Last 6 Months)", "Modern Indian History", "Indian Geography", "General Science (Physics/Bio)"],
  English: ["Active/Passive Voice", "Direct/Indirect Speech", "Vocabulary & Idioms", "Sentence Improvement"],
  Reasoning: ["Coding-Decoding", "Blood Relations", "Number Series", "Syllogism & Venn Diagrams"]
};

export default function StudyPlan({ user, weaknesses }: StudyPlanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAddingTo, setIsAddingTo] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");

  const initializationStarted = React.useRef(false);

  useEffect(() => {
    if (user && !initializationStarted.current) {
      initializationStarted.current = true;
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getStudyTasks(user.id);
      if (data && data.length > 0) {
        setTasks(data);
      } else {
        // Initialize with defaults if empty
        const initialized = await initializeStudyTasks(user.id, HIGH_YIELD_TOPICS);
        setTasks(initialized);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const updated = await updateStudyTask(task.id, { is_completed: !task.is_completed });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditValue(task.topic);
  };

  const saveEdit = async (taskId: string) => {
    if (!editValue.trim()) return;
    const updated = await updateStudyTask(taskId, { topic: editValue });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      setEditingTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const success = await deleteStudyTask(taskId);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleAddTask = async (subject: string) => {
    if (!newValue.trim()) return;
    const added = await createStudyTask(user.id, subject, newValue);
    if (added) {
      setTasks(prev => [...prev, added]);
      setNewValue("");
      setIsAddingTo(null);
    }
  };

  const getSubjectMetrics = (subject: string) => {
    if (!weaknesses) return { accuracy: 0, hours: 10, priority: 'Medium' };
    
    const subjectData = Object.entries(weaknesses)
      .filter(([key]) => key.toLowerCase().includes(subject.toLowerCase()))
      .map(([_, val]: any) => val);

    if (subjectData.length === 0) return { accuracy: 0, hours: 12, priority: 'High' };

    const avgAccuracy = subjectData.reduce((acc, curr) => acc + curr.accuracy, 0) / subjectData.length;
    
    let hours = 0;
    let priority = 'Medium';
    if (avgAccuracy < 50) {
      hours = 18;
      priority = 'Critical';
    } else if (avgAccuracy < 75) {
      hours = 10;
      priority = 'High';
    } else {
      hours = 4;
      priority = 'Revision';
    }

    return { accuracy: Math.round(avgAccuracy), hours, priority };
  };

  const subjects = [
    { name: "Math", icon: <Calculator className="w-5 h-5" />, color: "blue" },
    { name: "GK", icon: <Globe className="w-5 h-5" />, color: "emerald" },
    { name: "English", icon: <Languages className="w-5 h-5" />, color: "rose" },
    { name: "Reasoning", icon: <Brain className="w-5 h-5" />, color: "purple" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Study Plan...</p>
      </div>
    );
  }

  return (
    <section className="mt-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2">
            <Flame className="w-4 h-4 fill-current" /> AI Recommended Focus
          </div>
          <h2 className="text-3xl font-black text-foreground">Next 7 Days <span className="text-blue-500">Study Plan</span></h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Personalized todo list synced across your devices.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
           <div className="flex flex-col items-center border-r border-white/10 pr-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Hrs</span>
              <span className="text-xl font-black text-foreground">42h</span>
           </div>
           <div className="flex flex-col items-center pl-2">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> AI Factor
              </span>
              <span className="text-xl font-black text-blue-500">1.4x</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subjects.map((subject, idx) => {
          const metrics = getSubjectMetrics(subject.name);
          const subjectTasks = tasks.filter(t => t.subject === subject.name);

          return (
            <motion.div 
              key={subject.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col group hover:border-white/20 transition-all duration-500"
            >
              {/* Header */}
              <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-${subject.color}-500/10 text-${subject.color}-500 group-hover:scale-110 transition-transform duration-500`}>
                    {subject.icon}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${
                      metrics.priority === 'Critical' ? 'text-rose-500' : 
                      metrics.priority === 'High' ? 'text-orange-500' : 'text-emerald-500'
                    }`}>
                      {metrics.priority} Priority
                    </span>
                    <span className="text-sm font-black text-foreground">{metrics.hours}h Total</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-foreground mb-1">{subject.name}</h3>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  <span>Current Mastery</span>
                  <span className="text-foreground">{metrics.accuracy}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.accuracy}%` }}
                    className={`h-full rounded-full bg-${subject.color}-500`}
                  />
                </div>
              </div>

              {/* Todo List */}
              <div className="flex-1 p-6 pt-2 bg-white/2 border-t border-white/5">
                <div className="space-y-4">
                  {subjectTasks.map((task) => (
                    <div key={task.id} className="flex flex-col gap-2 group/task">
                      {editingTaskId === task.id ? (
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl">
                          <input 
                            type="text" 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-transparent border-none text-sm text-foreground focus:ring-0 w-full"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                          />
                          <button onClick={() => saveEdit(task.id)} className="text-emerald-500 hover:scale-110 transition-transform">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingTaskId(null)} className="text-rose-500 hover:scale-110 transition-transform">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 w-full group/item">
                          <button 
                            onClick={() => toggleTask(task)}
                            className={`mt-0.5 rounded-full transition-colors ${
                              task.is_completed ? `text-${subject.color}-500` : "text-slate-600 hover:text-slate-400"
                            }`}
                          >
                            {task.is_completed ? <CheckCircle2 className="w-5 h-5 fill-current/10" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <div className="flex-1 flex flex-col">
                             <span className={`text-sm font-medium transition-all ${
                               task.is_completed ? "text-slate-500 line-through" : "text-slate-300"
                             }`}>
                               {task.topic}
                             </span>
                             <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                 {task.is_completed ? "Completed" : "Pending Study"}
                               </span>
                               <div className="flex items-center gap-2 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity">
                                 <button onClick={() => handleEditTask(task)} className="text-slate-500 hover:text-blue-500 transition-colors">
                                   <Edit2 className="w-3 h-3" />
                                 </button>
                                 <button onClick={() => handleDeleteTask(task.id)} className="text-slate-500 hover:text-rose-500 transition-colors">
                                   <Trash2 className="w-3 h-3" />
                                 </button>
                               </div>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Topic */}
                  {isAddingTo === subject.name ? (
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl mt-4">
                      <input 
                        type="text" 
                        value={newValue} 
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Study topic..."
                        className="bg-transparent border-none text-sm text-foreground focus:ring-0 w-full"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(subject.name)}
                      />
                      <button onClick={() => handleAddTask(subject.name)} className="text-blue-500 hover:scale-110 transition-transform">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsAddingTo(null)} className="text-rose-500 hover:scale-110 transition-transform">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingTo(subject.name)}
                      className="flex items-center gap-2 w-full text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest p-2 rounded-xl border border-dashed border-white/5 hover:border-white/20 transition-all mt-4"
                    >
                      <Plus className="w-3 h-3" /> Add Topic
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-white/5 flex items-center justify-center">
                 <button className={`text-[10px] font-black uppercase tracking-[0.2em] text-${subject.color}-500 hover:text-${subject.color}-400 transition-colors flex items-center gap-2`}>
                   View AI Resources <Target className="w-3 h-3" />
                 </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

