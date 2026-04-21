
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { pathToFileURL } = require('url');

async function testExtraction() {
    const filePath = path.join(process.cwd(), 'flok dance.pdf');
    const buffer = fs.readFileSync(filePath);
    
    const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
    console.log('Worker path:', workerPath);
    
    try {
        const workerUrl = pathToFileURL(workerPath).toString();
        console.log('Worker URL:', workerUrl);
        
        PDFParse.setWorker(workerUrl);
        
        const parser = new PDFParse({ data: buffer });
        console.log('Parser initialized');
        
        const result = await parser.getText();
        console.log('Extraction success. Length:', result.text.length);
        console.log('First 100 chars:', result.text.substring(0, 100));
    } catch (err) {
        console.error('EXtraction failed:', err);
    }
}

testExtraction();
