# PlantStay AI roadmap

Plant events are intentionally out of scope.

## Planned AI features

1. Balcony photo analysis: upload a balcony image, confirm city/location and sunlight, then receive layout observations and plant suggestions. UI and graceful profile-based fallback are now in place; Gemini server route is next.
2. Plant SOS: upload a plant photo, describe symptoms, and receive likely causes, immediate care steps, what to avoid, and a reassessment window.
3. AI care explanations: explain why each recommended plant fits the user's space and travel plan.
4. AI Plant Passport: turn the deterministic care plan into a friendly helper brief.
5. Garden-aware care chat: answer questions using only the user's saved plants, profile, and active trip.

The deterministic plant dataset and survival rules remain the source of truth. Gemini will explain, summarize, and interpret photos; it will not silently replace the core rules.

## Environment

Keep `GEMINI_API_KEY` in `.env` for server-side use. Do not rename it to `VITE_GEMINI_API_KEY`; Vite exposes `VITE_*` values to the browser.
