@echo off
echo ============================================================
echo   VERIFYING ANDROID SETUP
echo ============================================================
echo.

echo Checking ANDROID_HOME...
if not defined ANDROID_HOME (
    echo ✗ ANDROID_HOME is not set
    echo.
    echo Please run SETUP-SDK-STEP-BY-STEP.bat first
    pause
    exit /b 1
) else (
    echo ✓ ANDROID_HOME = %ANDROID_HOME%
)

echo.
echo Checking if SDK exists...
if not exist "%ANDROID_HOME%" (
    echo ✗ SDK path does not exist: %ANDROID_HOME%
    pause
    exit /b 1
) else (
    echo ✓ SDK found at: %ANDROID_HOME%
)

echo.
echo Checking adb (Android Debug Bridge)...
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ adb not found in PATH
    echo.
    echo Try adding manually:
    echo %ANDROID_HOME%\platform-tools
    pause
    exit /b 1
) else (
    echo ✓ adb found!
    adb version
)

echo.
echo Checking Java...
java -version 2>&1 | findstr /C:"version" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Java not found
    echo.
    echo You need Java JDK 17. Download from:
    echo https://www.oracle.com/java/technologies/downloads/#java17
    pause
    exit /b 1
) else (
    echo ✓ Java found!
    java -version 2>&1 | findstr /C:"version"
)

echo.
echo ============================================================
echo   ✓ ALL CHECKS PASSED!
echo ============================================================
echo.
echo Your Android development environment is ready!
echo.
echo Next steps:
echo   1. Connect your Android device via USB
echo   2. Enable USB debugging on your device
echo   3. Run: .\BUILD-LOCAL-APK.bat
echo.
echo OR test with: adb devices
echo   (Should show your connected device)
echo.
pause
