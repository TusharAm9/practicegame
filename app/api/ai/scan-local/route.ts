
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { extractTextFromPDF, generateQuestionsFromText } from "@/utils/supabase/ai_engine";
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
    console.log(`AI: Sending prompt to Gemini for local scan. Subject: ${subject}`);
    const result = await generateQuestionsFromText(text, prompt);
    
    // Handle both { test_batches: [...] } and direct array of questions
    let testBatches = [];
    if (result.test_batches && Array.isArray(result.test_batches)) {
      testBatches = result.test_batches;
    } else if (Array.isArray(result)) {
      // If it returned a flat array, wrap it in a single batch
      testBatches = [{
        subject: subject,
        title: "Mock Set",
        questions: result
      }];
    } else if (result.questions && Array.isArray(result.questions)) {
      // If it returned an object with questions but no batches
      testBatches = [{
        subject: result.subject || subject,
        title: result.title || "Mock Set",
        questions: result.questions
      }];
    }

    console.log(`AI: Processing ${testBatches.length} test batches...`);

    // 5. Save all generated batches to Database
    const savedTests = [];
    for (const batch of testBatches) {
      if (!batch.questions || !Array.isArray(batch.questions) || batch.questions.length === 0) continue;

      const { data: testData, error: insertError } = await supabase
        .from('ai_tests')
        .insert({
          user_id: user.id,
          title: `${batch.title}: ${fileName.replace('.pdf', '')}`,
          subject: batch.subject || subject,
          questions: batch.questions,
          difficulty: "standard"
        })
        .select()
        .single();
      
      if (!insertError) {
        savedTests.push(testData);
      } else {
        console.error("AI: Error inserting test batch:", insertError);
      }
    }

    console.log(`AI: Successfully saved ${savedTests.length} tests.`);
    return NextResponse.json({ success: true, tests: savedTests });

  } catch (error: any) {
    console.error("Local Scan Route Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
