// ElevenLabs vocal guidance to the driver.
// Called automatically on route deviation / anomaly detection.
// MVP: generates the message; TTS call is stubbed until the API key is configured.

const MESSAGES = {
  speeding: (d) => `Please slow down. You are traveling at ${d.speedKmh} kilometers per hour.`,
  unauthorized_detour: (d) => `You are ${d.kmOffRoute} kilometers off the planned route. Please return to the itinerary.`,
  excessive_stop: (d) => `You have been stopped for ${d.stopMinutes} minutes. Please resume your trip or contact dispatch.`,
  arrived_too_fast: () => `Trip completed unusually fast. This has been logged for review.`,
};

export async function sendVoiceAlert(trip, anomaly) {
  const text = MESSAGES[anomaly.type]?.(anomaly.details ?? {}) ?? 'Attention: trip anomaly detected.';
  console.log(`[voice-alert] trip=${trip.id} driver=${trip.driverId}: "${text}"`);

  if (!process.env.ELEVENLABS_API_KEY) return { text, delivered: false };

  // TODO: call ElevenLabs TTS and deliver audio to the driver's phone session
  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
  //   headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
  //   body: { text, model_id: 'eleven_turbo_v2' }
  // Delivery: stream to the driver web app via WebSocket/SSE, or push audio URL.
  return { text, delivered: false };
}
