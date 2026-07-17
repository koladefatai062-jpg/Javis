// native/android/JarvisAccessibilityService.kt
//
// This is the core of "full control" mode. Android requires the user to
// manually enable this in Settings > Accessibility > Installed Apps — it
// cannot be turned on programmatically. That confirmation step exists
// specifically so malware can't silently grant itself this power, and your
// own build should never try to bypass it.
//
// This file goes in: android/app/src/main/java/com/yourapp/jarvis/
// You'll need to run `expo prebuild` first to generate the native android/
// folder, since this can't run inside Expo Go.

package com.cyber.jarvis

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.graphics.Rect
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {

    companion object {
        var instance: JarvisAccessibilityService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Intentionally left minimal — this app acts on explicit commands
        // from the JS side rather than reacting to every screen event,
        // to avoid unnecessary background processing.
    }

    override fun onInterrupt() {}

    // --- Actions callable from the JS bridge via JarvisAccessibilityModule ---

    fun findNodeByLabel(root: AccessibilityNodeInfo?, label: String): AccessibilityNodeInfo? {
        if (root == null) return null
        if (root.text?.toString()?.contains(label, ignoreCase = true) == true ||
            root.contentDescription?.toString()?.contains(label, ignoreCase = true) == true
        ) {
            return root
        }
        for (i in 0 until root.childCount) {
            val result = findNodeByLabel(root.getChild(i), label)
            if (result != null) return result
        }
        return null
    }

    fun tapByLabel(label: String): Boolean {
        val node = findNodeByLabel(rootInActiveWindow, label) ?: return false
        val rect = Rect()
        node.getBoundsInScreen(rect)
        val path = Path()
        path.moveTo(rect.centerX().toFloat(), rect.centerY().toFloat())
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
            .build()
        return dispatchGesture(gesture, null, null)
    }

    fun typeInFocusedField(text: String): Boolean {
        val node = rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: return false
        val arguments = android.os.Bundle()
        arguments.putCharSequence(
            AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text
        )
        return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
    }

    fun readScreenText(): String {
        val builder = StringBuilder()
        collectText(rootInActiveWindow, builder)
        return builder.toString().trim()
    }

    private fun collectText(node: AccessibilityNodeInfo?, builder: StringBuilder) {
        if (node == null) return
        node.text?.let { builder.append(it).append(" ") }
        for (i in 0 until node.childCount) {
            collectText(node.getChild(i), builder)
        }
    }

    fun performBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)
    fun performHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)

    fun openAppByName(appName: String): Boolean {
        val pm = packageManager
        val apps = pm.getInstalledApplications(0)
        val match = apps.firstOrNull {
            pm.getApplicationLabel(it).toString().equals(appName, ignoreCase = true)
        } ?: return false
        val intent = pm.getLaunchIntentForPackage(match.packageName) ?: return false
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
        return true
    }
}
