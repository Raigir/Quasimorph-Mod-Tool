@echo off
title Mod Workflow Tool

echo ========================================
echo   Mod Workflow Tool - Starting...
echo ========================================
echo.

:: Create data dir if missing
if not exist "data" mkdir "data"

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo.
    echo Install it from https://nodejs.org
    echo Download the LTS version, run the installer, done.
    echo Then close this window and double-click start.bat again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found
node -v
echo.

:: Open browser
start "" "http://localhost:8080"

:: Start server (blocks until Ctrl+C)
node server.js
