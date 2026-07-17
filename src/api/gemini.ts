// src/api/gemini.ts
// Sends the conversation + available tools to Gemini, returns either a spoken
// reply or a function call the app should execute (e.g. tap a button on screen).

import { CONFIG } from '../config';

export type ChatMessage = {
  role: 'user' | 'model';
  parts: any[];
};

// Tools exposed to Gemini via its function-calling format. Each maps to a
// native action executed through the Accessibility Service bridge.
export const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'tap_screen_element',
        description:
          'Tap a button, icon, or text element currently visible on screen by its visible label.',
        parameters: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'Visible text or content-description of the element to tap' },
          },
          required: ['label'],
        },
      },
      {
        name: 'open_app',
        description: 'Open an installed app by name (e.g. "WhatsApp", "Instagram", "Settings").',
        parameters: {
          type: 'object',
          properties: { app_name: { type: 'string' } },
          required: ['app_name'],
        },
      },
      {
        name: 'type_text',
        description: 'Type text into the currently focused input field on screen.',
        parameters: {
          type: 'object',
          properties: { text: { type: 'string' } },
          required: ['text'],
        },
      },
      {
        name: 'read_screen',
        description: 'Read back the text content currently visible on screen.',
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'go_back',
        description: 'Press the device back button.',
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'go_home',
        description: 'Press the device home button.',
        parameters: { type: 'object', properties: {} },
      },
    ],
  },
];

export async function askGemini(history: ChatMessage[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: CONFIG.SYSTEM_PROMPT }] },
      tools: TOOLS,
      contents: history,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API failed: ${response.status} ${errText}`);
  }

  return response.json();
}

// Helper: pulls plain text out of a Gemini response, if present.
export function extractText(result: any): string | null {
  const parts = result?.candidates?.[0]?.content?.parts ?? [];
  const textPart = parts.find((p: any) => typeof p.text === 'string');
  return textPart?.text ?? null;
}

// Helper: pulls a function call out of a Gemini response, if present.
export function extractFunctionCall(result: any): { name: string; args: any } | null {
  const parts = result?.candidates?.[0]?.content?.parts ?? [];
  const fnPart = parts.find((p: any) => p.functionCall);
  return fnPart ? fnPart.functionCall : null;
}
