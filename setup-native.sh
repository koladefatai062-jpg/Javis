#!/bin/bash
# setup-native.sh
# Run this ONCE, after `npx expo prebuild -p android`.
# It copies the native accessibility files into place and patches the
# manifest/strings/MainApplication automatically — nothing to hand-edit.

set -e

PKG_PATH="android/app/src/main/java/com/cyber/jarvis"
MANIFEST="android/app/src/main/AndroidManifest.xml"
STRINGS="android/app/src/main/res/values/strings.xml"
MAIN_APP_KT="android/app/src/main/java/com/cyber/jarvis/MainApplication.kt"

echo "Creating package folder..."
mkdir -p "$PKG_PATH"
mkdir -p android/app/src/main/res/xml

echo "Copying native Kotlin files..."
cp native/android/JarvisAccessibilityService.kt "$PKG_PATH/"
cp native/android/JarvisAccessibilityModule.kt "$PKG_PATH/"
cp native/android/JarvisAccessibilityPackage.kt "$PKG_PATH/"
cp native/android/accessibility_service_config.xml android/app/src/main/res/xml/

echo "Adding accessibility service description string..."
if ! grep -q "accessibility_service_description" "$STRINGS"; then
  sed -i 's|</resources>|    <string name="accessibility_service_description">Lets Jarvis read on-screen text and tap/type on your behalf so it can carry out voice commands like opening apps or sending messages.</string>\n</resources>|' "$STRINGS"
fi

echo "Registering the service in AndroidManifest.xml..."
if ! grep -q "JarvisAccessibilityService" "$MANIFEST"; then
  python3 - "$MANIFEST" << 'PYEOF'
import sys, re

path = sys.argv[1]
with open(path) as f:
    content = f.read()

service_block = '''        <service
            android:name="com.cyber.jarvis.JarvisAccessibilityService"
            android:exported="true"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
    </application>'''

content = content.replace('    </application>', service_block)

with open(path, 'w') as f:
    f.write(content)
PYEOF
fi

echo "Registering the module in MainApplication.kt..."
if ! grep -q "JarvisAccessibilityPackage" "$MAIN_APP_KT"; then
  python3 - "$MAIN_APP_KT" << 'PYEOF'
import sys

path = sys.argv[1]
with open(path) as f:
    content = f.read()

content = content.replace(
    "val packages = PackageList(this).packages",
    "val packages = PackageList(this).packages\n              packages.add(com.cyber.jarvis.JarvisAccessibilityPackage())"
)

with open(path, 'w') as f:
    f.write(content)
PYEOF
fi

echo "Done. Native accessibility service is wired in."
echo "Next: npx expo run:android"
