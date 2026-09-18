import { polishPassportWithGemini } from '../server/gemini.js';
import { readBody, run } from './_helpers.js';
export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'POST required' });
  const body = readBody(request);
  return run(response, () => polishPassportWithGemini({ brief: body.brief, city: body.city }));
}
