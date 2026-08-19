import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with adequate payload limit for base64 images
  app.use(express.json({ limit: '25mb' }));

  // API Routes FIRST

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Server-side Gemini API Route Handler
  app.post('/api/generate', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY environment variable is not configured on the server.',
          results: []
        });
      }

      const { image, mimeType = 'image/png', prompt } = req.body;

      if (!image) {
        return res.status(400).json({
          error: 'Image data is required',
          results: []
        });
      }

      // Sanitize and extract base64 data & mimeType
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      let detectedMimeType = mimeType;
      if (image.startsWith('data:')) {
        const header = image.split(';')[0];
        if (header.includes(':')) {
          detectedMimeType = header.split(':')[1] || mimeType;
        }
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = prompt || `Analyze this image and detect all visual QR codes.
      
Strict Requirements:
1. Return a pure JSON array of strings containing the decoded data for each QR code found (e.g., ["https://example.com", "12345"]).
2. STRICTLY IGNORE any text, URLs, or phone numbers printed on the document background, footer, or header (like Facebook links or addresses). ONLY return data that is encoded inside a QR code pattern.
3. If no QR codes are found, return an empty array [].`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: detectedMimeType,
                data: base64Data,
              },
            },
            {
              text: systemPrompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },
      });

      const jsonText = response.text ? response.text.trim() : '[]';
      let results: string[] = [];
      try {
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed)) {
          results = parsed;
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini response as JSON array:', jsonText);
      }

      return res.json({
        success: true,
        results,
        text: jsonText,
      });
    } catch (error: any) {
      console.error('Server Gemini API generation error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to process image with Gemini AI',
        results: [],
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
