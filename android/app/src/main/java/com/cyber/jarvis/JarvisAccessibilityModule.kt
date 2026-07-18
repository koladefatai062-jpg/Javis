// native/android/JarvisAccessibilityModule.kt
// React Native bridge — exposes JarvisAccessibilityService methods to JS
// via NativeModules.JarvisAccessibility (see src/native/AccessibilityBridge.ts)

package com.cyber.jarvis

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

class JarvisAccessibilityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "JarvisAccessibility"

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        promise.resolve(JarvisAccessibilityService.instance != null)
    }

    @ReactMethod
    fun tapByLabel(label: String, promise: Promise) {
        val result = JarvisAccessibilityService.instance?.tapByLabel(label) ?: false
        promise.resolve(result)
    }

    @ReactMethod
    fun typeInFocusedField(text: String, promise: Promise) {
        val result = JarvisAccessibilityService.instance?.typeInFocusedField(text) ?: false
        promise.resolve(result)
    }

    @ReactMethod
    fun readScreen(promise: Promise) {
        promise.resolve(JarvisAccessibilityService.instance?.readScreenText() ?: "")
    }

    @ReactMethod
    fun openAppByName(appName: String, promise: Promise) {
        val result = JarvisAccessibilityService.instance?.openAppByName(appName) ?: false
        promise.resolve(result)
    }

    @ReactMethod
    fun performBack() {
        JarvisAccessibilityService.instance?.performBack()
    }

    @ReactMethod
    fun performHome() {
        JarvisAccessibilityService.instance?.performHome()
    }
}
