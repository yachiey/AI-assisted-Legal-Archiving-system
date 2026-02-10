@echo off
setlocal
title Legal Arch AI - Sharing Mode

echo ===================================================
echo     LEGAL ARCH AI - LOCAL SHARING LAUNCHER
echo ===================================================
echo.

:: 1. Build Frontend Assets
echo [1/8] Building Frontend Assets...
call npm run build
if %errorlevel% neq 0 (
    echo Error building frontend assets.
    pause
    exit /b %errorlevel%
)
echo Frontend built successfully.
echo.

:: 2. Start Embedding Service
echo [2/8] Starting Embedding Service (Port 5001)...
start "Embedding Service" cmd /k "python aiservice/run_embedding_service.py"

:: 3. Start Text Extraction Service
echo [3/8] Starting Text Extraction Service (Port 5002)...
start "Text Extraction Service" cmd /k "python aiservice/run_text_extraction.py"

:: 4. Start Scanner Bridge Service
echo [4/8] Starting Scanner Bridge Service (Port 3000)...
start "Scanner Bridge Service" cmd /k "cd scanner_service && node server.js"

:: 5. Start AI Bridge Service
echo [5/8] Starting AI Bridge Service (Port 5003)...
start "AI Bridge Service" cmd /k "python aiservice/run_ai_bridge.py"

:: 6. Start Chatbot Service
echo [6/8] Starting Chatbot Service (Port 5000)...
start "Chatbot Service" cmd /k "python aiservice/run_chatbot.py"

:: 7. Get Local IP and Start Laravel Server
echo [7/8] Starting Web Server...
echo.
echo ===================================================
echo YOUR APPLICATION WILL BE AVAILABLE AT:
echo.
for /f "tokens=2,3 delims={,}" %%a in ('"wmic nicconfig where IpEnabled=True get IpAddress /value | find "192.168""') do echo      http://%%~a:8000
echo.
echo (Share this link with other staff on the same network)
echo ===================================================
echo.

:: Open Browser for Host and Start Server
echo.
echo ===================================================
echo ACCESS INSTRUCTIONS:
echo 1. FOR YOU (HOST):
echo    Opening http://localhost:8000 ...
echo.
echo 2. FOR OTHERS (NETWORK):
echo    Share the IP address shown below (e.g., http://192.168.x.x:8000)
echo ===================================================
echo.

:: Auto-open localhost for the host user
start "" "http://localhost:8000"

:: 8. Start Queue Worker
echo [8/8] Starting Queue Worker...
start "Queue Worker" cmd /k "php artisan queue:work"

:: Wait for services to stabilize
echo Waiting for services to start...
timeout /t 3 /nobreak > nul

:: Clear config cache to ensure fresh database settings
php artisan config:clear > nul 2>&1

php artisan serve --host 0.0.0.0 --port 8000

pause
