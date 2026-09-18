const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function analyzeBalconyWithGemini({ imageBase64, mimeType, city, profile }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `Analyze this balcony for plant planning. City: ${city || 'unknown'}. User profile: ${JSON.stringify(profile)}. Return concise JSON with title, summary, bullets (array), lightZones (array), and cautions (array). Treat the image as visual context, not a definitive measurement.` },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.35, maxOutputTokens: 900, thinkingConfig: { thinkingLevel: 'low' } },
    }),
    signal: AbortSignal.timeout(50000),
  });

  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned no analysis');
  return JSON.parse(text);
}

export async function analyzePlantSosWithGemini({ imageBase64, mimeType, city, notes }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [
        { text: `You are a cautious plant-care assistant. Analyze this plant photo for ${city || 'an unknown city'}. The owner noticed: ${notes || 'no additional notes'}. Return only JSON with title, summary, steps (array of 3 to 5 low-risk actions), and cautions (array). Do not claim a definitive diagnosis; recommend a local horticulturist for severe or worsening symptoms.` },
        { inline_data: { mime_type: mimeType, data: imageBase64 } },
      ] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.35, maxOutputTokens: 900, thinkingConfig: { thinkingLevel: 'low' } },
    }),
    signal: AbortSignal.timeout(50000),
  });
  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned no SOS analysis');
  return JSON.parse(text);
}

export { GEMINI_MODEL, GEMINI_ENDPOINT };
