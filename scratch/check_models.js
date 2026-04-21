
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

async function listModels() {
    try {
        console.log("Checking API Key: ", process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Present (Starts with " + process.env.NEXT_PUBLIC_GEMINI_API_KEY.substring(0, 5) + ")" : "MISSING");
        
        // Note: The SDK doesn't have a direct listModels, we use the fetch API or just try a few known ones
        const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.5-flash-latest", "gemini-1.0-pro"];
        
        console.log("\nTesting Model Availability:");
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("test");
                console.log(`✅ ${modelName}: AVAILABLE`);
            } catch (err) {
                console.log(`❌ ${modelName}: FAILED (${err.message.substring(0, 50)}...)`);
            }
        }
    } catch (error) {
        console.error("ListModels Error:", error);
    }
}

listModels();
