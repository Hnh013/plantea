import { analyzeBalconyWithGemini } from '../server/gemini.js';
import { imageFrom, readBody, run } from './_helpers.js';
export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'POST required' });
  const body = readBody(request); const image = imageFrom(body);
  return run(response, () => analyzeBalconyWithGemini({ imageBase64: image.data, mimeType: image.mimeType, city: body.city, profile: body.profile }));
}
