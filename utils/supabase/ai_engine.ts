// AI Logic for PDF extraction and Question Generation
import { PDFParse } from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { pathToFileURL } from 'url';

// Initialize Gemini API (User needs to provide this in .env.local)

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
    try {
        console.log('AI: Starting PDF extraction...');
        
        // Use the PDFParse class from the modern pdf-parse library
        console.log('AI: Using PDFParse class');
        const workerUrl = pathToFileURL(workerPath).toString();
        
        // Explicitly set the worker source
        PDFParse.setWorker(workerUrl);
        
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        
        if (!result || !result.text || result.text.trim().length === 0) {
            throw new Error('PDF extraction returned empty text.');
        }
        
        console.log('AI: Extraction successful, characters:', result.text.length);
        return result.text;
    } catch (error: any) {
        console.error('AI: Error parsing PDF:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`);
    }
}

export async function generateQuestionsFromText(text: string, promptOrSubject: string): Promise<any> {
    // 1. Ensure API Key is present
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing in environment variables.');
    }

    // 2. Initialize Gemini inside the function to pick up fresh env vars
    const genAI = new GoogleGenerativeAI(apiKey);

    // 3. Define the prompt
    const prompt = promptOrSubject.length > 100 
        ? promptOrSubject 
        : `Generate 10 highly relevant, exam-style MCQs for the subject: ${promptOrSubject}. 
           Return a JSON array of objects with exactly these keys: question (string), options (array of 4 strings), answer (integer index 0-3), and explanation (string).
           Source material: ${text.substring(0, 40000)}`;

    // 4. Try multiple model names (Updated for 2026 environment)
    const modelNames = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-pro-latest"];
    let lastError: any = null;

    for (const name of modelNames) {
        try {
            console.log(`AI: Using model ${name} for generation...`);
            const model = genAI.getGenerativeModel({ 
                model: name,
                generationConfig: { responseMimeType: "application/json" }
            });

            console.log('AI: Sending prompt to Gemini... (Prompt length:', prompt.length, ')');
            const result = await model.generateContent(prompt);
            const textResponse = result.response.text();
            
            console.log('AI: Received response from Gemini. Length:', textResponse.length);

            // Robust JSON extraction
            let cleanJson = textResponse;
            const jsonMatch = textResponse.match(/[\{\[]([\s\S]*)[\}\]]/);
            if (jsonMatch) {
                cleanJson = jsonMatch[0];
            } else {
                cleanJson = textResponse.replace(/```json\n?|```/g, "").trim();
            }
            
            const parsed = JSON.parse(cleanJson);
            return parsed;

        } catch (error: any) {
            console.error(`AI Error with model ${name}:`, error.message);
            lastError = error;
            
            // Check for critical security error (Leaked Key)
            if (error.message?.includes('leaked')) {
                throw new Error("CRITICAL: Your Google API key has been reported as LEAKED and deactivated. Please generate a NEW key in Google AI Studio.");
            }

            // If it's a 404 or model not supported, try the next one
            if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('not supported')) {
                continue;
            }
            
            // For other errors (like JSON parse), we might still want to try another model or throw
            if (error instanceof SyntaxError) {
                console.warn('AI: JSON Parse Error, trying next model if available...');
                continue;
            }
        }
    }

    throw new Error(`AI failed to generate questions after trying multiple models. Last error: ${lastError?.message}`);
}
