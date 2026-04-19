
const API_KEY = "AIzaSyDek0xlPx4gPBLJLMaN3qTJod18KQJ6UPI";

async function testEndpoints() {
    const urls = [
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`
    ];

    for (const url of urls) {
        console.log(`\nTesting URL: ${url.replace(API_KEY, "KEY_HIDDEN")}`);
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
            });
            const data = await response.json();
            console.log(`Status: ${response.status}`);
            console.log(`Response: ${JSON.stringify(data, null, 2).substring(0, 500)}`);
        } catch (err) {
            console.log(`Fetch Error: ${err.message}`);
        }
    }
}

testEndpoints();
