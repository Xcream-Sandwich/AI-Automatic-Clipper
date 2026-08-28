const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const fs = require('fs');
    fs.writeFileSync('test.txt', 'hello');
    const result = await ai.files.upload({ file: 'test.txt', config: { mimeType: 'text/plain' } });
    console.log("Upload Success:", result.name);
  } catch (e) {
    console.error("Upload Error:", e);
  }
}
run();
