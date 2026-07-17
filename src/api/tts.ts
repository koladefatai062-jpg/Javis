// src/api/tts.ts
// Simple on-device TTS via expo-speech. Swap in ElevenLabs here later if you
// want a more natural/custom voice — this version works offline and free.

import * as Speech from 'expo-speech';

export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, {
    rate: 1.0,
    pitch: 1.0,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
