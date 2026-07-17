// src/api/whisper.ts
// Transcribes a recorded audio file using Groq's hosted Whisper endpoint.
// Groq is used here because it's significantly faster and cheaper than OpenAI's
// own Whisper API for this use case — swap the URL/key if you prefer OpenAI directly.

import { CONFIG } from '../config';

export async function transcribeAudio(fileUri: string): Promise<string> {
  const formData = new FormData();

  // React Native's FormData accepts this file-shape object directly
  formData.append('file', {
    uri: fileUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as any);
  formData.append('model', 'whisper-large-v3-turbo');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CONFIG.GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Transcription failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.text as string;
}
