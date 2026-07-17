# Jarvis Assistant — Setup (Termux, phone-only)

Everything below runs in Termux. Nothing to hand-edit — two scripts do the
wiring for you.

## 1. Install deps
```
pkg install nodejs git python
cd jarvis-assistant
npm install
```

## 2. Set your API keys (run this yourself — don't paste keys into chat with Claude or anyone else)
```
bash set-keys.sh YOUR_GROQ_KEY YOUR_GEMINI_KEY
```
- Groq key: https://console.groq.com
- Gemini key: https://aistudio.google.com/apikey

## 3. Generate the native Android project
```
npx expo prebuild -p android
```

## 4. Wire in the native accessibility service (fully automated)
```
bash setup-native.sh
```
This copies the Kotlin files into place and patches the manifest, strings,
and MainApplication.kt automatically.

## 5. Push to GitHub (needed for cloud build)
```
git init
git add .
git commit -m "jarvis assistant"
```
Create a private repo on GitHub, then:
```
git remote add origin <your-repo-url>
git push -u origin main
```
⚠️ Since your keys are now baked into `src/config.ts`, make sure the repo
is set to **private** before pushing.

## 6. Build the APK in the cloud
```
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```
Wait for the build (few minutes) — EAS gives you a download link/QR code.

## 7. Install
Open the link on your phone, download, install (allow "unknown sources" if
prompted).

## 8. Enable the permission
Open the app → tap "Enable full control" → toggle Jarvis on in
Settings > Accessibility > Installed Apps.

## 9. Use it
Hold the button, speak, release. First test: try "open WhatsApp."

## Notes
- Package name is fixed as `com.cyber.jarvis` throughout — already
  consistent across `app.json` and all native files.
- If a tap/type action fails, `read_screen` gives Gemini visibility into
  what's actually on screen.
