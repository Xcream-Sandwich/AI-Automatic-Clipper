const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const result = await ai.files.upload({ file: 'test.txt', config: { mimeType: 'text/plain' } });
  console.log(result.state);
  let fileObj = await ai.files.get({ name: result.name });
  console.log(fileObj.state);
}
run();
