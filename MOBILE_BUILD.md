
# Mobile Build Instructions (Android & iOS)

Glimmer is built as a web application. To compile it into a native Android or iOS application, we use **Capacitor**. Capacitor acts as a bridge, allowing this React app to run natively on mobile devices.

## Prerequisites

1.  **Node.js** installed.
2.  **Mobile Development Tools:**
    *   **Android:** Download and install [Android Studio](https://developer.android.com/studio).
    *   **iOS:** A Mac is required. Download and install [Xcode](https://developer.apple.com/xcode/).

## 1. Initial Setup

First, we need to install Capacitor and initialize it in the project.

Run the following commands in your project root:

```bash
# Build the web app first (creates the 'dist' or 'build' folder)
npm run build

# Install Capacitor core and CLI
npm install @capacitor/core
npm install -D @capacitor/cli

# Initialize Capacitor
# Prompts: Name="Glimmer", ID="com.glimmer.app" (or your own ID)
npx cap init
```

*Note: Ensure your `capacitor.config.json` points `webDir` to your build output folder (usually `dist` for Vite or `build` for CRA).*

## 2. Building for Android

### Step 2.1: Add Android Platform

```bash
npm install @capacitor/android
npx cap add android
```

### Step 2.2: Sync Project

Every time you change your React code, run `npm run build` followed by:

```bash
npx cap sync
```

### Step 2.3: Configure Permissions

The app uses the **Microphone** and **Camera**. You must declare these permissions.

1.  Open the Android project:
    ```bash
    npx cap open android
    ```
2.  In Android Studio, navigate to `app/src/main/AndroidManifest.xml`.
3.  Add the following permissions inside the `<manifest>` tag:

    ```xml
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    ```

### Step 2.4: Build and Run

1.  Connect your Android device via USB (or use an Emulator).
2.  In Android Studio, click the **Run** (green play) button.

---

## 3. Building for iOS

*Note: You must be on a macOS computer to build for iOS.*

### Step 3.1: Add iOS Platform

```bash
npm install @capacitor/ios
npx cap add ios
```

### Step 3.2: Sync Project

```bash
npm run build
npx cap sync
```

### Step 3.3: Configure Permissions

1.  Open the iOS project:
    ```bash
    npx cap open ios
    ```
2.  In Xcode, click on the **App** project in the left navigator.
3.  Select the **Info** tab (Info.plist).
4.  Add the following keys to explain why the app needs access:

    | Key | Value (Description) |
    | --- | --- |
    | **Privacy - Microphone Usage Description** | "Glimmer needs access to the microphone for voice-to-text diary entries." |
    | **Privacy - Camera Usage Description** | "Glimmer needs access to the camera to attach photos to your entries." |
    | **Privacy - Photo Library Additions Usage Description** | "Glimmer needs access to save generated images." |

### Step 3.4: Signing & Build

1.  In Xcode, click the **Signing & Capabilities** tab.
2.  Select your **Team** (you can use a free Apple ID for personal testing).
3.  Connect your iPhone or select a Simulator.
4.  Click the **Play** button to build and run.

---

## Troubleshooting

### API Key Issues
Since this is a client-side app, your `API_KEY` must be embedded in the build.
*   Ensure your build script (e.g., `react-scripts build` or `vite build`) replaces `process.env.API_KEY` with the actual string.
*   **Security Warning:** Be aware that embedding API keys in a client-side mobile app allows anyone who decompiles the app to see the key. For production apps, it is recommended to proxy requests through a backend server.

### Voice Dictation
The web implementation uses `window.SpeechRecognition` (Web Speech API).
*   **Android:** Usually works out of the box via the WebView (Chrome).
*   **iOS:** The standard `WKWebView` does not fully support the Web Speech API natively. You may need to install a Capacitor plugin:
    ```bash
    npm install @capacitor-community/speech-recognition
    npx cap sync
    ```
    *And update `EntryForm.tsx` to use this plugin instead of the browser native API if deploying to iOS.*
