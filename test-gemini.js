const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const fs = require('fs');
    fs.writeFileSync('test.txt', 'hello');
    const result = await ai.files.upload({ file: 'test.txt' });
    console.log(result.name);
  } catch (e) {
    console.error(e);
  }
}
run();
