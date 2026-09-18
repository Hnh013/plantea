import { analyzeBalconyWithGemini, analyzePlantSosWithGemini, explainPlantWithGemini, polishPassportWithGemini } from './gemini.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 12_000_000) reject(new Error('request too large'));
    });
    request.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('invalid json')); }
    });
    request.on('error', reject);
  });
}

function imageFrom(body) {
  const image = body?.image;
  if (!image || typeof image !== 'object' || !allowedMimeTypes.has(image.mimeType) || typeof image.data !== 'string' || image.data.length < 20 || image.data.length > 10_000_000) {
    throw new Error('unsupported image');
  }
  return image;
}

function send(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

export function apiMiddleware() {
  return {
    name: 'plantstay-gemini-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith('/api/')) return next();
        if (request.method !== 'POST') return send(response, 405, { error: 'POST required' });
        try {
          const body = await readJson(request);
          let result = null;
          if (request.url === '/api/explain-plant') {
            result = await explainPlantWithGemini({ plant: body.plant, profile: body.profile, score: body.score });
          } else if (request.url === '/api/polish-passport') {
            result = await polishPassportWithGemini({ brief: body.brief, city: body.city });
          } else if (request.url === '/api/analyze-balcony' || request.url === '/api/analyze-plant-sos') {
            const image = imageFrom(body);
            result = request.url === '/api/analyze-balcony'
              ? await analyzeBalconyWithGemini({ imageBase64: image.data, mimeType: image.mimeType, city: body.city, profile: body.profile })
              : await analyzePlantSosWithGemini({ imageBase64: image.data, mimeType: image.mimeType, city: body.city, notes: body.notes });
          }
          if (!result) return next();
          return send(response, 200, { ...result, source: 'gemini', model: 'gemini-flash-latest' });
        } catch (error) {
          const message = error?.message === 'GEMINI_API_KEY is not configured' ? error.message : 'Gemini analysis is temporarily unavailable.';
          return send(response, message.includes('configured') ? 503 : 502, { error: message, detail: process.env.NODE_ENV === 'production' ? undefined : error?.message });
        }
      });
    },
  };
}
