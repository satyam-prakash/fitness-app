@echo off
echo ============================================================
echo   SUPER FAST LOCAL BUILD - Uses Docker (No Android Studio!)
echo ============================================================
echo.
echo This builds locally in 3-7 minutes using Docker.
echo NO EAS queue! NO Android Studio needed!
echo.
echo Requirements:
echo  - Docker Desktop installed and running
echo.
echo Don't have Docker? Download from:
echo https://www.docker.com/products/docker-desktop
echo.
pause

cd /d "%~dp0"

echo.
echo Checking Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker not found!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    echo After installing, start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker found! Starting local build...
echo.
echo This will take 3-7 minutes on first build.
echo Subsequent builds will be faster (2-3 minutes).
echo.

call npx eas-cli build --platform android --local --profile preview

echo.
echo ============================================================
echo   BUILD COMPLETE!
echo ============================================================
echo.
echo Your APK is in the current directory!
echo.
pause
