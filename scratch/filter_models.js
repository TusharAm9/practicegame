
const API_KEY = "AIzaSyDek0xlPx4gPBLJLMaN3qTJod18KQJ6UPI";

async function findModel() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const models = data.models || [];
        
        console.log(`Total models found: ${models.length}`);
        
        const geminiModels = models.filter(m => m.name.includes("gemini"));
        console.log("\nGemini models available:");
        geminiModels.forEach(m => {
            console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
        });

        const flash15 = models.find(m => m.name.includes("1.5-flash"));
        console.log("\nGemini 1.5 Flash detail:");
        console.log(JSON.stringify(flash15, null, 2));

    } catch (err) {
        console.log(`Fetch Error: ${err.message}`);
    }
}

findModel();
