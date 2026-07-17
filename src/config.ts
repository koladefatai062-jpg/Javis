// src/config.ts
// Fill these in with your own keys. NEVER commit real keys to a public repo —
// use a .env file + expo-constants, or a backend proxy in production.

export const CONFIG = {
  // Get from https://console.groq.com (free tier, fast Whisper transcription)
  GROQ_API_KEY: 'gsk_your_actual_groq_key',

  // Get from https://aistudio.google.com/apikey
  GEMINI_API_KEY: 'AIzaSy_your_actual_gemini_key',

  // Gemini model to use for the assistant's "brain"
  GEMINI_MODEL: 'gemini-2.5-flash',

  // System prompt defining the assistant's persona + behavior
  SYSTEM_PROMPT: `You are JARVIS, a sharp, efficient personal AI assistant living on the user's phone.
Speak concisely — your replies are spoken aloud via TTS, so avoid long paragraphs, lists, or markdown.
When the user asks you to do something actionable (set a reminder, check the time, etc.), use the
available tools rather than just describing what you would do.`,
};
