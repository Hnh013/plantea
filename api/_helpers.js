export function readBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
  return {};
}

export function send(response, status, payload) {
  response.status(status).json(payload);
}

export function imageFrom(body) {
  const image = body?.image;
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!image || !allowed.has(image.mimeType) || typeof image.data !== 'string' || image.data.length < 20 || image.data.length > 10_000_000) throw new Error('unsupported image');
  return image;
}

export async function run(response, task) {
  try {
    return send(response, 200, { ...(await task()), source: 'gemini' });
  } catch (error) {
    const configured = error?.message === 'GEMINI_API_KEY is not configured';
    return send(response, configured ? 503 : 502, { error: configured ? error.message : 'Gemini analysis is temporarily unavailable.' });
  }
}
