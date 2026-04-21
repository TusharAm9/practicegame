import { PDFParse } from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { pathToFileURL } from 'url';

// Initialize Gemini API (User needs to provide this in .env.local)
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
    try {
        console.log('AI: Starting PDF extraction...');
        const workerUrl = pathToFileURL(workerPath).toString();
        console.log('AI: Worker URL:', workerUrl);
        
        // Explicitly set the path to the pdf.worker for Node.js environment
        PDFParse.setWorker(workerUrl);
        
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        
        if (!result || !result.text || result.text.trim().length === 0) {
            console.error('AI: Extraction failed - No text found in PDF');
            throw new Error('PDF extraction returned empty text. This might be a scanned document or image-only PDF.');
        }
        
        console.log('AI: Extraction successful, characters:', result.text.length);
        return result.text;
    } catch (error: any) {
        console.error('AI: Error parsing PDF:', error);
        // Include the actual error message in the re-thrown error for better debugging
        throw new Error(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`);
    }
}

export async function generateQuestionsFromText(text: string, promptOrSubject: string): Promise<any> {
    let model;
    try {
        model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
    } catch (e) {
        console.warn("AI: Falling back to gemini-pro due to initialization error", e);
        model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: { responseMimeType: "application/json" }
        });
    }
    
    // If it's a small subject string, we wrap it in a default prompt
    const prompt = promptOrSubject.length > 100 
        ? promptOrSubject 
        : `Generate 10 exam-style MCQs for the subject: ${promptOrSubject}. 
           Return a JSON array of objects with question, options (array), answer (index), and explanation.
           Source material: ${text.substring(0, 40000)}`;

    try {
        console.log('AI: Sending prompt to Gemini...');
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        
        // Clean up potential markdown wrappers
        const cleanJson = textResponse.replace(/```json\n?|```/g, "").trim();
        
        try {
            return JSON.parse(cleanJson);
        } catch (parseError) {
            console.error('AI: JSON Parse Error. Raw Response:', textResponse);
            throw new Error('AI returned invalid JSON format. Please try again.');
        }
    } catch (error: any) {
        console.error('Gemini Generation Error:', error);
        throw new Error(`AI failed to generate questions: ${error.message || 'Unknown error'}`);
    }
}
