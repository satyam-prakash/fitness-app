# Quick Android SDK Setup for Local Builds

## Why Local Builds?
- ✅ **No queue** - Build in 2-5 minutes instead of waiting 15+ minutes
- ✅ **Instant testing** - Install directly to your device
- ✅ **Free** - No build minutes used
- ✅ **Keep using Expo** - No complex migration needed

## Setup Steps (One-time, 10 minutes)

### 1. Install Android Studio
Download from: https://developer.android.com/studio

### 2. Install Android SDK
During Android Studio installation:
- ✅ Check "Android SDK"
- ✅ Check "Android SDK Platform"
- ✅ Check "Android Virtual Device"

### 3. Set Environment Variables

**Windows:**
1. Open "Edit system environment variables"
2. Add these variables:

```
ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
```

3. Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

### 4. Verify Setup
Open new terminal and run:
```bash
adb version
```

You should see Android Debug Bridge version info.

### 5. Build Your APK
Run:
```bash
cd frontend
.\BUILD-LOCAL-APK.bat
```

## Alternative: Use EAS Local Builds (Faster than cloud)

If you don't want to install Android Studio, you can use:
```bash
cd frontend
npx eas-cli build --platform android --local
```

This builds on your machine (2-5 min) without the queue, but requires Docker.

## Comparison

| Method | Time | Setup Required |
|--------|------|----------------|
| EAS Cloud Build | 15-30 min | ❌ None |
| Local Build (npx expo run:android) | 2-5 min | ✅ Android Studio |
| EAS Local Build | 3-7 min | ✅ Docker |

## Quick Commands

### Development Build (Debug)
```bash
npx expo run:android
```

### Production Build (Release APK)
```bash
npx expo run:android --variant release
```

### Check connected devices
```bash
adb devices
```

## Troubleshooting

### "adb not found"
- Android SDK not installed or PATH not set
- Restart terminal after setting environment variables

### "SDK location not found"
Create `local.properties` in `android/` folder:
```
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

### Build fails with Gradle error
```bash
cd android
.\gradlew clean
cd ..
npx expo run:android --variant release
```

## Notes
- First build takes 5-10 minutes (downloads dependencies)
- Subsequent builds: 2-3 minutes
- APK location: `android/app/build/outputs/apk/release/app-release.apk`
- You can still use EAS Build for production releases
