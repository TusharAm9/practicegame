
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Directly using the key from user_metadata/env
const API_KEY = "AIzaSyDek0xlPx4gPBLJLMaN3qTJod18KQJ6UPI"; 
const genAI = new GoogleGenerativeAI(API_KEY);

async function listAllModels() {
    try {
        console.log("Fetching available models from Google AI...");
        // Wait, the SDK uses genAI.getGenerativeModel(). 
        // To list, we need the fetch API or the administrative method if available.
        // In the JS SDK, there isn't a direct listModels method, we have to try them.
        
        const testModels = [
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-1.0-pro",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro-latest"
        ];

        for (const m of testModels) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Hi");
                console.log(`✅ Model '${m}' is AVAILABLE`);
            } catch (err) {
                console.log(`❌ Model '${m}' is NOT FOUND or disabled (${err.message.substring(0, 40)}...)`);
            }
        }
    } catch (e) {
        console.error("General Error:", e);
    }
}

listAllModels();
