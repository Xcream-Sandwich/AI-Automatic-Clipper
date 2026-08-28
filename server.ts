import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';
import youtubedl from 'youtube-dl-exec';
import { GoogleGenAI, Type } from '@google/genai';

const execAsync = promisify(exec);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory simple storage for MVP
  const videoStoragePath = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(videoStoragePath)) {
    fs.mkdirSync(videoStoragePath, { recursive: true });
  }

  app.post('/api/analyze', async (req, res) => {
    try {
      const { apiKey, url, clipCount, durationLabel } = req.body;
      if (!apiKey || !url) {
        return res.status(400).json({ error: 'API Key and URL are required' });
      }

      const videoId = Date.now().toString();
      const videoFilename = `video_${videoId}.mp4`;
      const videoPath = path.join(videoStoragePath, videoFilename);

      console.log('Downloading video...', url);
      await youtubedl(url, {
        output: videoPath,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
      });

      console.log('Video downloaded to', videoPath);

      // Call Gemini API
      const ai = new GoogleGenAI({ apiKey });
      
      console.log('Uploading to Gemini...');
      // Note: In a real app we'd need to use the Gemini File API properly
      // For this MVP, we'll try to upload the file
      let fileObj = await ai.files.upload({ file: videoPath });
      
      // Wait for processing
      let status = fileObj.state;
      while (status === 'PROCESSING') {
        console.log('Gemini processing video...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        fileObj = await ai.files.get({ name: fileObj.name });
        status = fileObj.state;
      }
      
      if (status === 'FAILED') {
        throw new Error('Gemini failed to process the video.');
      }

      console.log('Requesting content generation...');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [
          fileObj,
          `You are an expert viral video editor. Analyze this video. 
Find the ${clipCount} most engaging, funny, or educational moments. 
Each clip should be roughly ${durationLabel} long.
Return the clips in a structured format with clear start/end times in HH:MM:SS format.`
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: "List of recommended video clips",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Catchy title for the clip" },
                reason: { type: Type.STRING, description: "Why this clip is potentially viral" },
                startTime: { type: Type.STRING, description: "Start timestamp in HH:MM:SS" },
                endTime: { type: Type.STRING, description: "End timestamp in HH:MM:SS" }
              },
              required: ["title", "reason", "startTime", "endTime"]
            }
          },
          temperature: 0.7,
        }
      });

      console.log('Gemini analysis complete.');
      const clips = JSON.parse(response.text || '[]');

      res.json({ success: true, videoPath, clips });
    } catch (error: any) {
      console.error('Error analyzing video:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/crop', async (req, res) => {
    try {
      const { videoPath, clips } = req.body;
      if (!videoPath || !clips || !Array.isArray(clips)) {
        return res.status(400).json({ error: 'Missing video path or clips array' });
      }

      const results = [];
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const outFileName = `cropped_clip_${Date.now()}_${i}.mp4`;
        const outFilePath = path.join(videoStoragePath, outFileName);

        const cmd = `ffmpeg -y -i "${videoPath}" -ss ${clip.startTime} -to ${clip.endTime} -vf "crop=ih*9/16:ih" -c:a copy "${outFilePath}"`;
        console.log('Running FFmpeg:', cmd);
        
        await execAsync(cmd);
        results.push({ ...clip, outputFileName: outFileName });
      }

      res.json({ success: true, results });
    } catch (error: any) {
      console.error('Error cropping video:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
  
  // Serve processed files for download
  app.use('/downloads', express.static(videoStoragePath));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
