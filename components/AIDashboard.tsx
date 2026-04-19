
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileUp, 
  Brain, 
  FileText, 
  Play, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  BookOpen,
  History,
  Library
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import AITestPlayer from "./AITestPlayer";

interface AIDashboardProps {
  user: any;
  initialPdfs: any[];
  initialTests: any[];
  localFiles: string[];
}

export default function AIDashboard({ user, initialPdfs, initialTests, localFiles }: AIDashboardProps) {
  const searchParams = useSearchParams();
  const requestedSubject = searchParams.get("subject");

  const [pdfs, setPdfs] = useState(initialPdfs);
  const [tests, setTests] = useState(initialTests);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setNotification({ type: "error", message: "Please upload a PDF file." });
      return;
    }

    setIsUploading(true);

    try {
      const filePath = `user_materials/${user.id}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: pdfData, error: dbError } = await supabase
        .from('pdf_uploads')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_path: filePath
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setPdfs([pdfData, ...pdfs]);
      
      // Start AI Generation
      await triggerAIGeneration(pdfData);

    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to process PDF." });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerAIGeneration = async (pdf: any) => {
    setIsGenerating(true);
    // Gemini 2.5 Flash analysis phase
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId: pdf.id, filePath: pdf.file_path })
      });

      const result = await response.json();
      
      if (result.success) {
        setNotification({ 
          type: "success", 
          message: `Successfully generated ${result.tests?.length || 0} tests from your upload!` 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "AI Generation failed." });
    } finally {
      setIsGenerating(false);
    }
  };

  const deletePdf = async (id: string, path: string) => {
    await supabase.storage.from('materials').remove([path]);
    await supabase.from('pdf_uploads').delete().eq('id', id);
    setPdfs(pdfs.filter(p => p.id !== id));
  };

  const handleLocalSync = async (fileName: string) => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/ai/scan-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, subject: requestedSubject })
      });

      const result = await response.json();
      
      if (result.success) {
        setNotification({ 
          type: "success", 
          message: `${result.tests?.length || 0} new mock tests generated and filed in your vaults!` 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to sync local file." });
    } finally {
      setIsScanning(false);
    }
  };

  const cancelGeneration = () => {
    setIsGenerating(false);
    setIsScanning(false);
    setIsUploading(false);
    setNotification(null);
  };

  if (activeTest) {
    return <AITestPlayer test={activeTest} onExit={() => setActiveTest(null)} />;
  }

  return (
    <main className="min-h-screen p-6 md:p-8 relative overflow-hidden bg-background font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <header className="mb-6 space-y-2">
          <div className="flex items-center gap-3 text-blue-500 font-black uppercase tracking-widest text-[10px]">
            <Brain className="w-4 h-4" /> AI Engine v1.0
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Mock Test <span className="text-blue-500">Generator</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl">
            Upload your study PDFs or choose from our Library to generate personalized mock tests.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Left Column: Upload Center */}
          <div className="space-y-4">
            <div className="glass p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 w-48 h-48 -mr-16 -mt-16 bg-blue-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-8 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-blue-500 mb-2">
                  <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Upload Center</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">New PDF Material</p>
                  </div>
                </div>
                
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Have new study notes or a chapter PDF? Drop it here to instantly generate Sets 1 & 2 for your practice.
                </p>

                <label className={`
                  flex-1 flex flex-col items-center justify-center w-full min-h-[250px] border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all
                  ${isUploading ? "border-blue-500 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.15)]" : "border-white/10 hover:border-blue-500/50 hover:bg-white/5"}
                `}>
                  <div className="flex flex-col items-center justify-center p-8">
                    {isUploading ? (
                      <div className="text-center space-y-6">
                        <div className="relative">
                          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
                          <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse" />
                        </div>
                        <p className="text-sm font-black text-blue-500 tracking-tighter animate-pulse">Processing Material...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <FileUp className="w-10 h-10 text-slate-500" />
                        </div>
                        <p className="mb-2 text-lg font-black text-foreground">Choose a PDF File</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Max size 50MB</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading || isGenerating || isScanning} />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Local Library slice */}
          <div className="space-y-4 flex flex-col">
            <div className="glass p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden flex-1 h-full min-h-[450px]">
              <div className="absolute bottom-0 left-0 w-48 h-48 -ml-16 -mb-16 bg-purple-500/10 rounded-full blur-3xl font-black" />
              
              <div className="relative z-10 space-y-8 flex flex-col h-full">
                <div className="flex items-center gap-4 text-purple-500 mb-2">
                  <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center">
                    <Library className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Local Library</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Pre-Uploaded Papers</p>
                  </div>
                </div>

                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Select a paper from our local archives to refresh your tests. Powered by subject-aware sync.
                </p>
                
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-3">
                  {localFiles
                    .sort((a, b) => {
                      if (!isMounted || !requestedSubject) return 0;
                      if (a.toLowerCase().includes(requestedSubject.toLowerCase())) return -1;
                      if (b.toLowerCase().includes(requestedSubject.toLowerCase())) return 1;
                      return 0;
                    })
                    .map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ x: 5 }}
                      className="p-5 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col gap-4 border-l-4 border-l-transparent hover:border-l-blue-500 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10">
                          <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <p className="text-sm font-bold text-foreground truncate">{file}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">PDF Document</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleLocalSync(file)}
                        disabled={isScanning || isGenerating}
                        className="w-full py-4 rounded-2xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                      >
                         {isScanning ? "Analyzing Material..." : "Sync & Generate"}
                      </button>
                    </motion.div>
                  ))}
                  {localFiles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <AlertCircle className="w-12 h-12 text-slate-700" />
                      <p className="text-slate-500 italic">No files found in our local vault.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Immersive AI Progress Overlay */}
      <AnimatePresence>
        {(isGenerating || isScanning || isUploading) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg glass p-10 rounded-[3rem] border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] text-center space-y-8"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse rounded-full" />
                <Brain className="w-16 h-16 text-blue-500 relative z-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground">
                  {isUploading ? "Uploading Material..." : isScanning ? "Analyzing Source..." : "Gemini is Thinking..."}
                </h2>
                <p className="text-slate-400 font-medium">Developing high-quality MCQs for your vault</p>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 15, ease: "linear", repeat: Infinity }}
                  className="absolute inset-0 bg-linear-to-r from-blue-600 via-purple-500 to-blue-600 w-[200%]"
                />
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">
                  <span className={isUploading ? "text-blue-500" : ""}>Extract</span>
                  <span className={isScanning ? "text-blue-500" : ""}>Analyze</span>
                  <span className={isGenerating ? "text-blue-500" : ""}>Generate</span>
                </div>
                
                <button 
                  onClick={cancelGeneration}
                  className="px-8 py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-black uppercase tracking-[0.2em] transition-all border border-rose-500/20"
                >
                  Stop Generation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Centered Modal Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`
                glass w-full max-w-md p-10 rounded-[3rem] border shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col items-center text-center gap-6
                ${notification.type === 'success' ? 'border-emerald-500/30' : 'border-rose-500/30'}
              `}
            >
              <div className={`
                p-5 rounded-3xl
                ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}
              `}>
                {notification.type === 'success' ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
              </div>
              
              <div className="space-y-2">
                <h4 className={`text-2xl font-black ${notification.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {notification.type === 'success' ? 'Generation Success' : 'Generation Failed'}
                </h4>
                <p className="text-slate-300 text-base font-medium leading-relaxed">
                  {notification.message}
                </p>
              </div>

              <button 
                onClick={() => setNotification(null)}
                className={`
                  w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all
                  ${notification.type === 'success' ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white' : 'bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white'}
                `}
              >
                Continue to Practice
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
