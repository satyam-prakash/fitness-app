@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ============================================
echo   FIXING YOUR EXPO APP - PLEASE WAIT
echo ============================================
echo.

cd /d "d:\Fitness-app\frontend"
echo Current directory: %CD%
echo.

echo [1/6] Clearing npm cache...
call npm cache clean --force
if %errorlevel% neq 0 (
    echo ERROR: Failed to clear cache
    echo Try running as Administrator
    pause
    exit /b 1
)
echo     Done!

echo.
echo [2/6] Removing node_modules folder...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo     Done!
) else (
    echo     Already removed!
)

echo.
echo [3/6] Removing package-lock.json...
if exist "package-lock.json" (
    del "package-lock.json"
    echo     Done!
) else (
    echo     Already removed!
)

echo.
echo [4/6] Installing all dependencies (this takes 2-3 minutes)...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo     Done!

echo.
echo [5/6] Installing expo-barcode-scanner...
call npm install expo-barcode-scanner
if %errorlevel% neq 0 (
    echo ERROR: Failed to install expo-barcode-scanner
    pause
    exit /b 1
)
echo     Done!

echo.
echo [6/6] Starting Expo with clear cache...
echo.
echo ============================================
echo   STARTING YOUR APP NOW!
echo ============================================
echo.

start cmd /k "cd /d d:\Fitness-app\frontend && npx expo start --clear"

echo.
echo All fixed! Your app should be loading now.
echo Press any key to close this window...
pause >nul
