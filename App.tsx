// App.tsx
// Push-to-talk loop: record -> transcribe -> ask Gemini -> execute any tool
// calls via the accessibility bridge -> speak the result.

import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { transcribeAudio } from './src/api/whisper';
import { askGemini, extractText, extractFunctionCall, ChatMessage } from './src/api/gemini';
import { speak } from './src/api/tts';
import { AccessibilityBridge } from './src/native/AccessibilityBridge';

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [status, setStatus] = useState('Hold to talk');
  const [log, setLog] = useState<string[]>([]);
  const historyRef = useRef<ChatMessage[]>([]);

  async function startRecording() {
    const { status: permStatus } = await Audio.requestPermissionsAsync();
    if (permStatus !== 'granted') {
      setStatus('Mic permission denied');
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(rec);
    setStatus('Listening...');
  }

  async function stopRecordingAndProcess() {
    if (!recording) return;
    setStatus('Thinking...');
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (!uri) return;

    try {
      const transcript = await transcribeAudio(uri);
      appendLog(`You: ${transcript}`);
      historyRef.current.push({ role: 'user', parts: [{ text: transcript }] });

      await runTurn();
    } catch (err: any) {
      setStatus('Error: ' + err.message);
    }
  }

  // Runs one Gemini turn, executing any function call, looping until Gemini
  // gives a final spoken answer (handles multi-step actions).
  async function runTurn() {
    const result = await askGemini(historyRef.current);
    const content = result?.candidates?.[0]?.content;
    if (content) {
      historyRef.current.push({ role: 'model', parts: content.parts });
    }

    const text = extractText(result);
    const fnCall = extractFunctionCall(result);

    if (text) {
      appendLog(`Jarvis: ${text}`);
      speak(text);
    }

    if (fnCall) {
      const toolResult = await executeTool(fnCall.name, fnCall.args);
      historyRef.current.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: fnCall.name,
              response: { result: toolResult },
            },
          },
        ],
      });
      // Let Gemini react to the tool result (e.g. confirm the action out loud)
      await runTurn();
      return;
    }

    setStatus('Hold to talk');
  }

  async function executeTool(name: string, input: any): Promise<string> {
    switch (name) {
      case 'tap_screen_element':
        return (await AccessibilityBridge.tapElementByLabel(input.label)) ? 'tapped' : 'not found';
      case 'open_app':
        return (await AccessibilityBridge.openApp(input.app_name)) ? 'opened' : 'app not found';
      case 'type_text':
        return (await AccessibilityBridge.typeText(input.text)) ? 'typed' : 'no input field focused';
      case 'read_screen':
        return await AccessibilityBridge.readScreenText();
      case 'go_back':
        AccessibilityBridge.goBack();
        return 'done';
      case 'go_home':
        AccessibilityBridge.goHome();
        return 'done';
      default:
        return 'unknown tool';
    }
  }

  function appendLog(line: string) {
    setLog((prev) => [...prev, line]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>JARVIS</Text>
      <Text style={styles.status}>{status}</Text>

      <ScrollView style={styles.log}>
        {log.map((line, i) => (
          <Text key={i} style={styles.logLine}>{line}</Text>
        ))}
      </ScrollView>

      <Pressable
        style={styles.talkButton}
        onPressIn={startRecording}
        onPressOut={stopRecordingAndProcess}
      >
        <Text style={styles.talkButtonText}>HOLD</Text>
      </Pressable>

      <Pressable
        style={styles.enableButton}
        onPress={() => AccessibilityBridge.openSettingsToEnable()}
      >
        <Text style={styles.enableButtonText}>Enable full control (Accessibility)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60, paddingHorizontal: 20 },
  title: { color: '#d4af37', fontSize: 32, fontWeight: '700', letterSpacing: 4, textAlign: 'center' },
  status: { color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  log: { flex: 1, marginBottom: 20 },
  logLine: { color: '#ddd', marginBottom: 6 },
  talkButton: {
    backgroundColor: '#1a1a1a',
    borderColor: '#d4af37',
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  talkButtonText: { color: '#d4af37', fontSize: 18, fontWeight: '600', letterSpacing: 2 },
  enableButton: { paddingVertical: 14, alignItems: 'center' },
  enableButtonText: { color: '#666', fontSize: 12 },
});
