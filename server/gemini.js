const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";
const GEMINI_FALLBACK_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK_MODEL}:generateContent`;

async function fetchGemini(body, apiKey, endpoint = GEMINI_ENDPOINT) {
  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(50000),
    });
    if (response.status !== 429 && response.status !== 500 && response.status !== 503) return response;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
  }
  return response;
}

async function fetchWithFallback(body, apiKey) {
  const primary = await fetchGemini(body, apiKey);
  if (![429, 500, 503].includes(primary.status)) return primary;
  return fetchGemini(body, apiKey, GEMINI_FALLBACK_ENDPOINT);
}

export async function analyzeBalconyWithGemini({ imageBase64, mimeType, city, profile }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const response = await fetchWithFallback({
      contents: [{
        parts: [
          { text: `Analyze this balcony for plant planning. City: ${city || 'unknown'}. User profile: ${JSON.stringify(profile)}. Return concise JSON with title, summary, bullets (array), lightZones (array), and cautions (array). Treat the image as visual context, not a definitive measurement.` },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.35, maxOutputTokens: 900, thinkingConfig: { thinkingLevel: 'low' } },
    }, apiKey);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${detail.slice(0, 300)}`);
  }
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned no analysis');
  return JSON.parse(text);
}

export async function analyzePlantSosWithGemini({ imageBase64, mimeType, city, notes }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  const response = await fetchWithFallback({
      contents: [{ parts: [
        { text: `You are a cautious plant-care assistant. Analyze this plant photo for ${city || 'an unknown city'}. The owner noticed: ${notes || 'no additional notes'}. Return only JSON with title, summary, steps (array of 3 to 5 low-risk actions), and cautions (array). Do not claim a definitive diagnosis; recommend a local horticulturist for severe or worsening symptoms.` },
        { inline_data: { mime_type: mimeType, data: imageBase64 } },
      ] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.35, maxOutputTokens: 900, thinkingConfig: { thinkingLevel: 'low' } },
    }, apiKey);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${detail.slice(0, 300)}`);
  }
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned no SOS analysis');
  return JSON.parse(text);
}

export { GEMINI_MODEL, GEMINI_ENDPOINT, GEMINI_FALLBACK_MODEL, GEMINI_FALLBACK_ENDPOINT };
