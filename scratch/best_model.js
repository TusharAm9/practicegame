
const API_KEY = "AIzaSyDek0xlPx4gPBLJLMaN3qTJod18KQJ6UPI";

async function findBestModel() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const models = data.models || [];
        
        const candidates = models.filter(m => 
            m.supportedGenerationMethods.includes("generateContent") && 
            m.name.includes("pro")
        );

        console.log("Pro models with generateContent:");
        candidates.forEach(m => console.log(`- ${m.name}`));

        const flashCandidates = models.filter(m => 
            m.supportedGenerationMethods.includes("generateContent") && 
            m.name.includes("flash")
        );
        console.log("\nFlash models with generateContent:");
        flashCandidates.forEach(m => console.log(`- ${m.name}`));

    } catch (err) {
        console.log(`Fetch Error: ${err.message}`);
    }
}

findBestModel();
