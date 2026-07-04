// ElevenLabs vocal guidance to the driver.
// Called automatically on route deviation / anomaly detection.
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { insert, update } from '../utils/jsonStore.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const audioDir = path.join(dataDir, 'voice-alert-audio');
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

const MESSAGES = {
  speeding: (d) => `Please slow down. You are traveling at ${d.speedKmh} kilometers per hour.`,
  unauthorized_detour: (d) => `You are ${d.kmOffRoute} kilometers off the planned route. Please return to the itinerary.`,
  excessive_stop: (d) => `You have been stopped for ${d.stopMinutes} minutes. Please resume your trip or contact dispatch.`,
  arrived_too_fast: () => `Trip completed unusually fast. This has been logged for review.`,
};

function resolveVoiceId() {
  const configured = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (!configured || configured === 'default_voice_id' || configured === 'your_voice_id_here') {
    return DEFAULT_VOICE_ID;
  }
  return configured;
}

async function generateElevenLabsAudio(text) {
  if (!process.env.ELEVENLABS_API_KEY) return null;

  const voiceId = resolveVoiceId();
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${details}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function sendVoiceAlert(trip, anomaly) {
  const text = MESSAGES[anomaly.type]?.(anomaly.details ?? {}) ?? 'Attention: trip anomaly detected.';
  console.log(`[voice-alert] trip=${trip.id} driver=${trip.driverId}: "${text}"`);

  const alert = await insert('voiceAlerts', {
    clientId: trip.clientId,
    driverId: trip.driverId,
    tripId: trip.id,
    anomalyType: anomaly.type,
    anomalyDetectedAt: anomaly.detectedAt,
    text,
    status: process.env.ELEVENLABS_API_KEY ? 'generating' : 'text_only',
    playedAt: null,
  });

  try {
    const audio = await generateElevenLabsAudio(text);
    if (!audio) return { ...alert, delivered: false };

    await mkdir(audioDir, { recursive: true });
    const fileName = `${alert.id}.mp3`;
    await writeFile(path.join(audioDir, fileName), audio);

    return await update('voiceAlerts', alert.id, {
      status: 'ready',
      audioPath: fileName,
      audioUrl: `/api/voice-alerts/${alert.id}/audio`,
    });
  } catch (err) {
    console.error(`[voice-alert] failed trip=${trip.id} driver=${trip.driverId}:`, err);
    return await update('voiceAlerts', alert.id, {
      status: 'failed',
      error: err.message,
    });
  }
}
