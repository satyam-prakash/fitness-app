@echo off
echo ============================================================
echo   QUICK LOCAL APK BUILD - NO QUEUE REQUIRED!
echo ============================================================
echo.
echo This will build your APK locally in 2-5 minutes.
echo No waiting in EAS Build queue!
echo.
echo Requirements:
echo  - Android Studio installed
echo  - Android SDK configured
echo  - Physical device or emulator connected
echo.
pause

cd /d "%~dp0"

echo.
echo [1/4] Checking Android SDK...
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Android SDK not found!
    echo.
    echo Please install Android Studio from:
    echo https://developer.android.com/studio
    echo.
    echo Then set ANDROID_HOME environment variable:
    echo Example: C:\Users\YourName\AppData\Local\Android\Sdk
    echo.
    pause
    exit /b 1
)

echo [2/4] Installing dependencies...
call npm install

echo.
echo [3/4] Generating Android project (first time only)...
call npx expo prebuild --platform android

echo.
echo [4/4] Building APK locally...
echo This will take 2-5 minutes...
call npx expo run:android --variant release

echo.
echo ============================================================
echo   BUILD COMPLETE!
echo ============================================================
echo.
echo Your APK location:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
echo You can install it on your device now!
echo.
pause
