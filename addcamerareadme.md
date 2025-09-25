## Enabling Camera in Expo Router App (SDK 54)

This document details the end‑to‑end, production‑grade enablement of device camera functionality in the Expo app at `@camera/` (folder: `camera/`). It covers dependency resolution, platform permissions, routing, a typed camera screen, and verification steps.

### Environment
- **OS**: macOS (Darwin 24.6.0)
- **Project**: `/Users/rahulshendre/Desktop/Coding/Projects/Farm/camera`
- **Expo SDK**: 54.0.10 (from `package.json`)
- **React Native**: 0.81.4
- **expo-router**: 6.0.8

### Goals
- Provide an in‑app Camera tab using `expo-camera`’s `CameraView` API
- Handle runtime permissions via `useCameraPermissions`
- Configure iOS Info.plist usage strings and note Android requirements
- Keep code strictly typed and integrated with Expo Router tabs

---

## 1) Install and pin the correct camera module

We must install the `expo-camera` package compatible with Expo SDK 54. Using Expo’s installer ensures correct version resolution and native config.

```bash
cd /Users/rahulshendre/Desktop/Coding/Projects/Farm/camera
npx expo install expo-camera
```

Observed installation result:
- Added dependency: `expo-camera@~17.0.8` (SDK 54 compatible)

Verification:

```bash
npm pkg get dependencies.expo-camera
# => "~17.0.8"
```

Why this matters: Expo SDK versions map to specific native module versions. Installing with `expo install` prevents ABI/version drift.

---

## 2) Platform permissions and configuration

### iOS (Info.plist via app.json)
iOS requires a usage description string for camera access. Update `app.json` under `ios.infoPlist`:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to capture photos and scan codes."
      }
    }
  }
}
```

Notes:
- Without `NSCameraUsageDescription`, iOS builds will crash on first camera access.
- If recording video with audio is implemented later, also add `NSMicrophoneUsageDescription`.

### Android
- `expo-camera` automatically adds `CAMERA` permission.
- If you record video with audio, add `RECORD_AUDIO` in `app.json`:

```json
{
  "expo": {
    "android": {
      "permissions": ["RECORD_AUDIO"]
    }
  }
}
```

### Web
- Browser will prompt for camera permission at runtime; no `app.json` changes required.

---

## 3) Router integration (tab registration)

We expose the camera as a dedicated tab using Expo Router’s file‑based routing. Tabs layout file:

```tsx
// app/(tabs)/_layout.tsx (excerpt)
// Added a new screen named "camera" with an icon

<Tabs.Screen
  name="camera"
  options={{
    title: 'Camera',
    tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.fill" color={color} />,
  }}
/>
```

This registers a route at `app/(tabs)/camera.tsx` that renders in the tab navigator.

---

## 4) Camera screen implementation

Create a strongly typed camera screen that uses `CameraView` and `useCameraPermissions`.

```tsx
// app/(tabs)/camera.tsx
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={styles.centered}><Text>Requesting camera permission…</Text></View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>We need your permission to use the camera.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={cameraType}
        ref={(ref) => (cameraRef.current = ref)}
      />

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))}
        >
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: '#111', textAlign: 'center', marginBottom: 12 },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
  controls: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' },
  controlButton: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
});
```

Key implementation details:
- `useCameraPermissions()` returns `[permission, requestPermission]`. We proactively request if not yet obtained.
- `CameraView` is the declarative preview component. `facing` toggles between `'front'` and `'back'`.
- A `ref` is prepared for future actions (e.g., `takePictureAsync`) while keeping this step minimal.

TypeScript:
- The `CameraType` union ensures `facing` is always valid (`'front' | 'back'`).
- `strict` mode is enabled by `tsconfig.json` extending `expo/tsconfig.base`.

---

## 5) Build/run and verification

Start the project and navigate to the Camera tab:

```bash
npm run ios   # or: npx expo start --ios
npm run android   # or: npx expo start --android
npm run web   # for web verification
```

Expected behavior by platform:
- iOS: System prompt requests camera permission using the provided Info.plist string. On grant, live preview renders.
- Android: System permission dialog is presented; preview renders on grant.
- Web: Browser permission prompt appears; preview renders on grant.

Sanity checks:
- Tab bar shows icon `camera.fill`.
- Switching tabs preserves/tears down preview based on navigation.
- Flip button toggles between front/back cameras.

---

## 6) Advanced notes and troubleshooting

Performance and UX:
- Prefer rendering the camera screen only when visible (tabs automatically mount/unmount if configured; current setup relies on default router behavior). For strict control, consider lazy options or conditional rendering.
- Limit re-renders; keep state minimal to avoid camera preview hiccups.

iOS specific:
- Adding video/audio capture later requires `NSMicrophoneUsageDescription` and testing on device (simulator camera is virtualized and limited).
- If you enable background modes or AV session tuning, use EAS builds to test on‑device.

Android specific:
- If you record audio with video, add `RECORD_AUDIO` permission. On Android 13+, additional granular permissions may be requested by the OS.
- Some OEMs require you to toggle system camera permissions in Settings after first deny.

Web specific:
- Ensure page is served over HTTPS for camera access in most browsers.
- Browser may persist deny; reset permissions in site settings when testing.

Common issues:
- App crashes on iOS when accessing camera: Check `NSCameraUsageDescription` exists and is a non‑empty string.
- Black preview: Verify permissions granted, ensure physical device camera not in use by another app, and test on actual devices.
- Version mismatch: Always use `npx expo install` to align versions with SDK.

---

## 7) Auditable command and change log

Commands executed:

```bash
cd /Users/rahulshendre/Desktop/Coding/Projects/Farm/camera
npx expo install expo-camera
npm pkg get dependencies.expo-camera
```

Files created/edited:
- Created: `app/(tabs)/camera.tsx`
- Edited: `app/(tabs)/_layout.tsx` (added `Tabs.Screen` for `camera`)
- Edited: `app.json` (added `ios.infoPlist.NSCameraUsageDescription`)

Dependency state:

```bash
npm pkg get dependencies.expo-camera
# "~17.0.8"
```

---

## 8) Next steps (optional)
- Add capture controls: `takePictureAsync`, `recordAsync` with persistent storage.
- Barcode/QR scanning: combine with `barcodeScannerSettings` or unimodules that read barcodes.
- Access control: gate camera behind explicit user action to avoid surprise prompts.
- EAS Build profiles for production testing of camera features.

---

## References
- Expo Camera (SDK 54) docs: `https://docs.expo.dev/versions/latest/sdk/camera/`
- Expo Router: `https://docs.expo.dev/router/`
- iOS Privacy Keys: `https://developer.apple.com/documentation/bundleresources/information_property_list/nscamerausagedescription`


