
const API_KEY = "AIzaSyDek0xlPx4gPBLJLMaN3qTJod18KQJ6UPI";

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    console.log(`Testing URL: ${url.replace(API_KEY, "KEY_HIDDEN")}`);
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
        console.log(`Fetch Error: ${err.message}`);
    }
}

listModels();
