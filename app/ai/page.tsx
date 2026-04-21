
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import AIDashboard from "@/components/AIDashboard";
import { redirect } from "next/navigation";
import { getUserWeaknesses } from "@/utils/supabase/queries";
import fs from "fs";
import path from "path";

export default async function AIPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch performance data for AI study plan
  const weaknesses = await getUserWeaknesses(user.id);

  // Fetch local library files
  const localPdfDir = path.join(process.cwd(), "public", "pdfs");
  let localFiles: string[] = [];
  try {
    if (fs.existsSync(localPdfDir)) {
      localFiles = fs.readdirSync(localPdfDir).filter(f => f.endsWith(".pdf"));
    }
  } catch (err) {
    console.error("Error reading local PDFs:", err);
  }

  // Fetch previous PDFs and Tests
  const { data: pdfs } = await supabase
    .from('pdf_uploads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: tests } = await supabase
    .from('ai_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="flex-1 flex flex-col">
      <AIDashboard 
        user={user} 
        initialPdfs={pdfs || []} 
        initialTests={tests || []} 
        localFiles={localFiles}
        weaknesses={weaknesses}
      />
    </div>
  );
}
