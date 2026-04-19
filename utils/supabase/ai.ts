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
        
        if (!result || !result.text) {
            throw new Error('PDF extraction returned empty text');
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
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
    } catch (e) {
        model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
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
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        return JSON.parse(textResponse);
    } catch (error: any) {
        console.error('Gemini Generation Error:', error);
        throw new Error(`AI failed to generate questions: ${error.message || 'Unknown error'}`);
    }
}
