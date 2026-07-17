// src/native/AccessibilityBridge.ts
// JS-side interface to the native Kotlin AccessibilityService (see
// native/android/JarvisAccessibilityService.kt). This requires a custom dev
// build (expo run:android) — it will NOT work inside Expo Go, since Expo Go
// can't include custom native modules.

import { NativeModules } from 'react-native';

const { JarvisAccessibility } = NativeModules;

export const AccessibilityBridge = {
  // Opens Android's accessibility settings so the user can enable the service.
  // This is a one-time manual step — Android does not allow apps to
  // self-enable accessibility services (a deliberate anti-malware safeguard).
  openSettingsToEnable(): void {
    JarvisAccessibility?.openAccessibilitySettings();
  },

  isEnabled(): Promise<boolean> {
    return JarvisAccessibility?.isServiceEnabled() ?? Promise.resolve(false);
  },

  tapElementByLabel(label: string): Promise<boolean> {
    return JarvisAccessibility?.tapByLabel(label) ?? Promise.resolve(false);
  },

  typeText(text: string): Promise<boolean> {
    return JarvisAccessibility?.typeInFocusedField(text) ?? Promise.resolve(false);
  },

  readScreenText(): Promise<string> {
    return JarvisAccessibility?.readScreen() ?? Promise.resolve('');
  },

  openApp(appName: string): Promise<boolean> {
    return JarvisAccessibility?.openAppByName(appName) ?? Promise.resolve(false);
  },

  goBack(): void {
    JarvisAccessibility?.performBack();
  },

  goHome(): void {
    JarvisAccessibility?.performHome();
  },
};
