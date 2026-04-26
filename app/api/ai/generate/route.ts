
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { extractTextFromPDF, generateQuestionsFromText } from "@/utils/supabase/ai_engine";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pdfId, filePath } = await req.json();

    // 1. Download PDF from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('materials')
      .download(filePath);

    if (downloadError) throw downloadError;

    // 2. Extract Text
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractTextFromPDF(buffer);

    // 3. Detect Subject and Generate Questions
    let subject = "General Awareness";
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes("math") || lowerPath.includes("quant")) subject = "Math";
    else if (lowerPath.includes("reasoning")) subject = "Reasoning";
    else if (lowerPath.includes("english")) subject = "English";
    else if (lowerPath.includes("gk") || lowerPath.includes("current affairs")) subject = "GK";

    console.log(`AI: Detected subject "${subject}" from path "${filePath}"`);
    const questions = await generateQuestionsFromText(text, subject);

    // 4. Save to Database
    console.log(`AI: Saving ${questions?.length || 0} questions to database...`);
    const { data: testData, error: insertError } = await supabase
      .from('ai_tests')
      .insert({
        user_id: user.id,
        pdf_id: pdfId,
        title: `Test from PDF: ${new Date().toLocaleDateString()}`,
        subject: subject, // Fixed: use detected subject instead of hardcoded
        questions: questions,
        difficulty: "standard"
      })
      .select()
      .single();

    if (insertError) {
      console.error("AI: Database insert error:", insertError);
      throw insertError;
    }

    console.log("AI: Successfully created test:", testData.id);
    return NextResponse.json({ success: true, test: testData });

  } catch (error: any) {
    console.error("AI Route Error:", error);
    // Ensure we ALWAYS return JSON
    return NextResponse.json({ 
      success: false,
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
