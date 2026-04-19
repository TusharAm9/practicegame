
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyDek0xlPx4gPBLJLMaN3qTJod18KQJ6UPI"; 
const genAI = new GoogleGenerativeAI(API_KEY);

async function listAllModels() {
    try {
        console.log("Checking API Key: " + API_KEY.substring(0, 10) + "...");
        
        const m = "gemini-1.5-flash";
        console.log(`Testing model: ${m}`);
        
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Hi");
        console.log(`✅ Success!`);
    } catch (err) {
        console.log("Full Error Report:");
        console.log(JSON.stringify(err, null, 2));
        console.log("Error Message: " + err.message);
    }
}

listAllModels();
