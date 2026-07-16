import { Router } from "express";
import { config } from "../config.js";

const router = Router();

const BIBLE_SOURCE_BASE = 'https://bolls.life';

async function generateWithOpenAI(apiKey: string, prompt: string): Promise<string | null> {
  const response: any = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes Bible chapters concisely and accurately." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  try {
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function generateWithGemini(apiKey: string, prompt: string): Promise<string | null> {
  const response: any = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are a helpful assistant that summarizes Bible chapters concisely and accurately." }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "text/plain" },
      }),
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ?? null;
}

router.post('/ai/summarize-chapter', async (req: any, res: any) => {
  try {
    const { translation = 'NIV', bookIndex, chapter } = req.body as { translation?: string; bookIndex?: number; chapter?: number };
    if (!bookIndex || !chapter) {
      return res.status(400).json({ error: 'Missing bookIndex or chapter' });
    }

    // fetch the chapter text from the public source
    const url = `${BIBLE_SOURCE_BASE}/get-chapter/${translation}/${bookIndex}/${chapter}/`;
    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(502).json({ error: 'Failed to fetch chapter text' });
    }
    const verses = await resp.json();
    const chapterText = Array.isArray(verses)
      ? verses.map((v: any) => `${v.verse}. ${v.text}`).join('\n')
      : String(verses);

    const prompt = `Summarize the following Bible chapter in 2-3 concise sentences focusing on key events, themes, and the main message. Then provide one short, practical application (one sentence). Return the result as JSON with keys \"summary\" and \"application\".\n\nChapter text:\n${chapterText}`;

    const geminiKey = config.ai.geminiApiKey;
    const openaiKey = config.ai.openaiApiKey;

    if (!geminiKey && !openaiKey) {
      // Fallback: simple extractive summary
      const lines = chapterText.split('\n').slice(0, 4).join(' ');
      return res.json({ summary: `(Auto) ${lines}`, application: 'Reflect on one short action inspired by the chapter.' });
    }

    let aiText: string | null = null;
    if (geminiKey) aiText = await generateWithGemini(geminiKey, prompt);
    if (!aiText && openaiKey) aiText = await generateWithOpenAI(openaiKey, prompt);

    if (!aiText) return res.status(500).json({ error: 'AI provider failed to produce a summary' });

    // Try to parse JSON from AI response
    try {
      const parsed = JSON.parse(aiText);
      return res.json({ summary: String(parsed.summary ?? ''), application: String(parsed.application ?? '') });
    } catch {
      // If not JSON, attempt to split summary and application heuristically
      const parts = aiText.split(/\n\n|\n-\s*/).map((s) => s.trim()).filter(Boolean);
      return res.json({ summary: parts[0] ?? aiText, application: parts[1] ?? '' });
    }
  } catch (err: any) {
    req.log?.error?.({ err }, 'Failed to generate chapter summary');
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;
