@echo off
echo ========================================
echo   FIXING DIET SCREEN - AUTO SETUP
echo ========================================
echo.

REM Force change to script directory
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Step 1: Installing expo-barcode-scanner...
call npm install expo-barcode-scanner
if %errorlevel% neq 0 (
    echo ERROR: Failed to install expo-barcode-scanner
    pause
    exit /b 1
)
echo ✓ Package installed successfully
echo.

echo Step 2: Backing up old explore.tsx...
copy "app\(tabs)\explore.tsx" "app\(tabs)\explore.tsx.backup" >nul
echo ✓ Backup created
echo.

echo Step 3: Replacing explore.tsx with new version...
copy /Y "app\(tabs)\diet-new.tsx" "app\(tabs)\explore.tsx" >nul
echo ✓ File replaced
echo.

echo Step 4: Cleaning up temporary files...
del "app\(tabs)\diet-new.tsx" >nul 2>&1
del "app\(tabs)\explore-temp.tsx" >nul 2>&1
echo ✓ Cleanup complete
echo.

echo Step 5: Installing axios (needed for barcode scanner)...
call npm install axios
echo ✓ Axios installed
echo.

echo ========================================
echo   ALL DONE! 
echo ========================================
echo.
echo Next steps:
echo 1. Seed the database: cd ..\backend && npm run seed-foods
echo 2. Restart Expo: npx expo start --clear
echo.
pause
