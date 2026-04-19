
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { extractTextFromPDF, generateQuestionsFromText } from "@/utils/supabase/ai";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, subject: requestedSubject } = await req.json();
    if (!fileName) return NextResponse.json({ error: "No file specified" }, { status: 400 });

    const filePath = path.join(process.cwd(), "public", "pdfs", fileName);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found in local library" }, { status: 404 });
    }

    // 1. Read File Buffer
    const fileBuffer = fs.readFileSync(filePath);

    // 2. Extract Text
    const text = await extractTextFromPDF(fileBuffer);

    // 3. Detect Subject (Use requested subject if available)
    let subject = requestedSubject || "General Knowledge";
    if (fileName.toLowerCase().includes("english")) subject = "English";
    if (fileName.toLowerCase().includes("reasoning")) subject = "Reasoning";
    if (fileName.toLowerCase().includes("gk")) subject = "GK";
    if (fileName.toLowerCase().includes("math") || fileName.toLowerCase().includes("quant") || fileName.toLowerCase().includes("arithmetic")) subject = "Math";

    // 4. Generate Questions via Gemini (Multi-Batch Mode)
    const prompt = `
        You are an expert SSC-CGL exam setter. Analyze the following text extracted from a study material or solved paper.
        
        TASK:
        1. Identify ALL subjects present in this text from the following list: [Math, GK, English, Reasoning].
        2. For EACH subject identified, generate exactly TWO distinct sets of 10 highly relevant MCQs.
        3. If only one subject is dominant, generate TWO sets for that subject.
        4. Focus on exam-style patterns (SSC CGL Tier-I/II).
        5. Return ONLY a JSON object in this specific structure:
        {
          "test_batches": [
            {
              "subject": "Subject Name",
              "title": "Mock Set 1",
              "questions": [{ "question": "...", "options": ["...", "..."], "answer": 0, "explanation": "..." }]
            },
            {
              "subject": "Subject Name",
              "title": "Mock Set 2",
              "questions": [...]
            }
          ]
        }
        
        Text to analyze: ${text.slice(0, 50000)}
    `;
    const result = await generateQuestionsFromText(text, prompt);
    const testBatches = result.test_batches || [];

    // 5. Save all generated batches to Database
    const savedTests = [];
    for (const batch of testBatches) {
      const { data: testData, error: insertError } = await supabase
        .from('ai_tests')
        .insert({
          user_id: user.id,
          title: `${batch.title}: ${fileName.replace('.pdf', '')}`,
          subject: batch.subject,
          questions: batch.questions,
          difficulty: "standard"
        })
        .select()
        .single();
      
      if (!insertError) savedTests.push(testData);
    }

    return NextResponse.json({ success: true, tests: savedTests });

  } catch (error: any) {
    console.error("Local Scan Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
