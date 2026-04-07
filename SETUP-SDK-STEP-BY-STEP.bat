@echo off
echo ============================================================
echo   ANDROID SDK SETUP - Step by Step Guide
echo ============================================================
echo.
echo Android Studio is installed, but we need to set up the SDK.
echo.
echo FOLLOW THESE STEPS:
echo.
echo ============================================================
echo   STEP 1: Open Android Studio SDK Manager
echo ============================================================
echo.
echo 1. Open Android Studio
echo 2. On welcome screen, click "More Actions" or the 3-dot menu
echo 3. Select "SDK Manager"
echo.
echo    OR if you have a project open:
echo    - Go to: Tools ^> SDK Manager
echo.
pause
echo.
echo ============================================================
echo   STEP 2: Install Required SDK Components
echo ============================================================
echo.
echo In SDK Manager, make sure these are CHECKED and INSTALLED:
echo.
echo SDK Platforms tab:
echo   [x] Android 14.0 (API 34) - Latest stable
echo   [x] Android 13.0 (API 33)
echo   [x] Show Package Details (checkbox at bottom)
echo       [x] Android SDK Platform 34
echo.
echo SDK Tools tab:
echo   [x] Android SDK Build-Tools (latest version)
echo   [x] Android SDK Command-line Tools
echo   [x] Android SDK Platform-Tools
echo   [x] Android Emulator (optional, for testing)
echo.
echo Click "Apply" to install. This will take 5-10 minutes.
echo.
pause
echo.
echo ============================================================
echo   STEP 3: Note Your SDK Location
echo ============================================================
echo.
echo In SDK Manager, at the top you'll see:
echo   "Android SDK Location: C:\Users\YourName\AppData\Local\Android\Sdk"
echo.
echo COPY THIS PATH! We'll need it for environment variables.
echo.
echo Common SDK locations:
echo   - C:\Users\%USERNAME%\AppData\Local\Android\Sdk
echo   - C:\Android\Sdk
echo.
pause
echo.
echo ============================================================
echo   STEP 4: Set Environment Variables
echo ============================================================
echo.
echo Now I'll help you set the environment variables...
echo.
set /p SDK_PATH="Enter your Android SDK path (from Step 3): "

if not exist "%SDK_PATH%" (
    echo.
    echo ERROR: Path does not exist: %SDK_PATH%
    echo Please check the path and try again.
    pause
    exit /b 1
)

echo.
echo Setting ANDROID_HOME environment variable...
setx ANDROID_HOME "%SDK_PATH%"

echo Adding to PATH...
setx PATH "%PATH%;%SDK_PATH%\platform-tools;%SDK_PATH%\tools;%SDK_PATH%\tools\bin"

echo.
echo ============================================================
echo   SETUP COMPLETE!
echo ============================================================
echo.
echo IMPORTANT: Close this window and open a NEW terminal/PowerShell
echo for the changes to take effect.
echo.
echo Then run: .\VERIFY-ANDROID-SETUP.bat
echo.
pause
