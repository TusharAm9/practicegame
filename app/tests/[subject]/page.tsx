
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Library, Clock, Brain, Plus } from "lucide-react";
import SubjectTestList from "@/components/SubjectTestList";

export const metadata = {
  title: "Subject Tests | AI Exam OS",
  description: "View and attempt your categorized AI mock tests.",
};

export default async function SubjectPage({ params }: { params: { subject: string } }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { subject } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Map slugs to display names used in DB
  const subjectMap: Record<string, string[]> = {
    gk: ["General Knowledge", "GK"],
    english: ["English Language", "English"],
    math: ["Quantitative Aptitude", "Mathematics", "Math"],
    reasoning: ["General Intelligence & Reasoning", "Reasoning"]
  };

  const dbSubjects = subjectMap[subject.toLowerCase()] || [subject];

  const { data: tests } = await supabase
    .from("ai_tests")
    .select("*")
    .in("subject", dbSubjects)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen p-6 md:p-8 bg-background relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div className="space-y-4">
            <Link href="/" className="text-slate-500 hover:text-foreground transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-foreground capitalize">
              {subject} <span className="text-blue-500">Vault</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg">
              {tests?.length || 0} AI-Generated Mock Tests available.
            </p>
          </div>

          <Link 
            href={`/ai?subject=${subject}`}
            className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center gap-2 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Generate More
          </Link>
        </header>

        <SubjectTestList tests={tests || []} user={user} />
      </div>
    </main>
  );
}
