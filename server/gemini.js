const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_MODEL_CHAIN = [
  "gemini-3.8-flash",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
];

async function fetchWithFallback(body, apiKey) {
  let lastResponse;
  let lastError;
  for (const model of GEMINI_MODEL_CHAIN) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) return response;
      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }
  if (!lastResponse && lastError) throw lastError;
  return lastResponse;
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

async function generateJsonWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  const response = await fetchWithFallback({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.45, maxOutputTokens: 650, thinkingConfig: { thinkingLevel: 'low' } },
  }, apiKey);
  if (!response?.ok) {
    const detail = response ? await response.text() : 'No model response';
    throw new Error(`Gemini request failed: ${response?.status || 502} ${detail.slice(0, 300)}`);
  }
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned no text');
  return JSON.parse(text);
}

export function explainPlantWithGemini({ plant, profile, score }) {
  return generateJsonWithGemini(`You are a practical balcony-gardening assistant. Explain why this plant suits this balcony profile. Return only JSON with "title" and "explanation". Use 2 concise sentences, mention one strength and one watch-out, and do not invent facts. Plant: ${JSON.stringify(plant)}. Balcony profile: ${JSON.stringify(profile)}. Suitability score: ${score}%.`);
}

export function polishPassportWithGemini({ brief, city }) {
  return generateJsonWithGemini(`Rewrite this plant-care brief for a trusted helper. Return only JSON with "title" and "brief". Keep every care instruction and timing fact unchanged, use warm plain language, short lines, and no medical or diagnostic claims. City: ${city || 'unknown'}. Original brief: ${brief}`);
}

export { GEMINI_MODEL, GEMINI_ENDPOINT, GEMINI_MODEL_CHAIN };
