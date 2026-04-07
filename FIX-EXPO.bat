@echo off
echo ========================================
echo   FIXING EXPO DEPENDENCY ISSUES
echo ========================================
echo.

cd /d "d:\Fitness-app\frontend"
echo Current directory: %CD%
echo.

echo Step 1: Stopping Metro bundler...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo Step 2: Clearing npm cache...
call npm cache clean --force

echo Step 3: Removing node_modules and package-lock...
if exist node_modules (
    echo   Deleting node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo   Deleting package-lock.json...
    del package-lock.json
)

echo Step 4: Fresh install of all dependencies...
call npm install

echo Step 5: Installing expo-barcode-scanner...
call npm install expo-barcode-scanner

echo.
echo ========================================
echo   DEPENDENCIES FIXED!
echo ========================================
echo.
echo Now run:
echo   npx expo start --clear
echo.
pause
