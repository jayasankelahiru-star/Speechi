import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Presentation Evaluation API
app.post('/api/evaluate', async (req: Request, res: Response) => {
  try {
    const {
      transcript = '',
      frames = [],
      words = 0,
      wpm = null,
      fillers = { total: 0, breakdown: {} },
      audioMetrics = null,
      lessonContext = { id: 'quick', title: 'Quick practice', task: '', min: 0, isQuick: true },
      goal = '',
      language = 'en',
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Missing GEMINI_API_KEY. Please ensure the API key is configured.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const isLesson = !lessonContext.isQuick && lessonContext.id !== 'quick';
    const contextPrompt = isLesson
      ? `Lesson: "${lessonContext.title}". Task: "${lessonContext.task}". Target min score: ${lessonContext.min}.`
      : 'Quick practice session: evaluate general presentation delivery, body language, vocal variety, and content flow.';

    const langDirective =
      language === 'si'
        ? 'Respond in clear, natural Sinhala (සිංහල). Keep quoted words/idioms or technical terms recognizable.'
        : 'Respond in encouraging, professional English.';

    const voiceSummary = audioMetrics
      ? `Voice measurements: Total duration ${audioMetrics.span}s, speaking time ${audioMetrics.speak}s, silence percentage ${audioMetrics.silentPct}%, long pauses (>1s) count: ${audioMetrics.long}, volume variation (std dev) ${audioMetrics.volSd} dB (under 3 = flat, 3-7 = dynamic), average pitch ${audioMetrics.pitch || 'n/a'} Hz, pitch variation ${audioMetrics.pitchSd ?? 'n/a'} semitones (under 1.5 = monotone, 2-5 = natural, >6 = very animated).`
      : 'Voice audio measurements: not provided.';

    const userPromptText = `You are an expert, compassionate presentation coach and public speaking judge.
Evaluate this speaker's speech delivery carefully and constructively.

${contextPrompt}
${goal ? `Speaker's personal goal: ${goal}` : ''}
${langDirective}

SPEECH DATA:
- Transcript: """${transcript ? transcript.slice(0, 5000) : '[No transcript provided]'}"""
- Word count: ${words}
- Speaking Pace: ${wpm ? `${wpm} WPM` : 'unknown'} (Ideal conversational rate is 120-160 WPM)
- Filler words count: ${fillers.total || 0} (${JSON.stringify(fillers.breakdown || {})})
- ${voiceSummary}
- Video snapshots attached: ${frames.length} frames captured during the presentation.

ANALYSIS INSTRUCTIONS:
1. Video Analysis (if frames present): Observe eye contact (looking towards the camera lens vs down or wandering), facial expression, posture (open/confident vs hunched/stiff), and hand gestures.
2. Voice & Delivery: Factor in pace, pauses, pitch variation (flat vs musical), and filler words.
3. Content & Structure (if transcript provided): Assess hook, clear points, clarity, and conclusion. If no transcript, focus on delivery.
4. Give honest scores (0-100). Beginners typically score 45-75.
5. Provide actionable, supportive feedback with a tangible drill and a punchy rewritten opening sentence.`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Add up to 6 video frames as multimodal inlineData
    if (Array.isArray(frames) && frames.length > 0) {
      const selectedFrames = frames.slice(0, 6);
      for (const rawFrame of selectedFrames) {
        if (typeof rawFrame === 'string') {
          const cleanBase64 = rawFrame.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
          if (cleanBase64) {
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            });
          }
        }
      }
    }

    parts.push({ text: userPromptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: 'Overall score from 0 to 100' },
            content: { type: Type.INTEGER, description: 'Content clarity & depth 0-100, or null if no transcript' },
            structure: { type: Type.INTEGER, description: 'Logical flow & organization 0-100, or null' },
            voice: { type: Type.INTEGER, description: 'Vocal variety, clarity, energy 0-100' },
            pace: { type: Type.INTEGER, description: 'Speed & rhythm 0-100' },
            eye_contact: { type: Type.INTEGER, description: 'Gaze towards camera 0-100, or null if no video' },
            body_language: { type: Type.INTEGER, description: 'Posture & hand gestures 0-100, or null if no video' },
            expression: { type: Type.INTEGER, description: 'Facial engagement & warmth 0-100, or null' },
            summary: { type: Type.STRING, description: '2-3 sentences overview of the delivery' },
            tone_notes: { type: Type.STRING, description: '2 sentences on voice tone, pitch, energy, pauses' },
            video_notes: { type: Type.STRING, description: '2 sentences on eye contact and physical presence' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 positive things done well',
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 specific areas to improve',
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 concrete tips for the next talk',
            },
            drill: { type: Type.STRING, description: 'One 60-second exercise to practice right now' },
            better_opening: { type: Type.STRING, description: 'A more captivating rewritten opening sentence' },
          },
          required: [
            'score',
            'voice',
            'pace',
            'summary',
            'tone_notes',
            'video_notes',
            'strengths',
            'improvements',
            'suggestions',
            'drill',
          ],
        },
      },
    });

    const outputText = response.text || '{}';
    let resultJson: Record<string, unknown> = {};

    try {
      resultJson = JSON.parse(outputText);
    } catch {
      // Fallback in case of json wrapping
      const match = outputText.match(/\{[\s\S]*\}/);
      if (match) {
        resultJson = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse evaluation response from Gemini');
      }
    }

    res.json(resultJson);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error during evaluation:', err);
    res.status(500).json({
      error: err.message || 'Evaluation failed. Please try again.',
    });
  }
});

// Vite Middleware for dev or Express Static for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SpeakUp server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
