@echo off
title DEVz HUB — Launcher
color 0A
cls

echo.
echo  ===========================================
echo   DEVz HUB — START SEKWENCJA
echo  ===========================================
echo.

:: ===================================================
:: 1. DASHBOARD MAIN (port 4200)
:: ===================================================
echo  [1/4]  Dashboard server (localhost:4200)...
start "DEVz HUB Dashboard" /min cmd /k "cd /d U:\JIMBO_NEW_OP_INIT\dashboard && python server.py 4200"
timeout /t 2 /nobreak >nul

:: ===================================================
:: 2. KB SERVER — ChromaDB RAG (port 7071)
:: ===================================================
echo  [2/4]  KB Server — ChromaDB RAG (localhost:7071)...
start "KB Server :7071" /min cmd /k "cd /d U:\The_DEVz_HUB_of_work\knowledge_base && python kb_server.py"
timeout /t 2 /nobreak >nul

:: ===================================================
:: 3. LIBRARIES API — RAG BIZ/PRV (port 7070)
:: ===================================================
echo  [3/4]  Libraries API — BIZ/PRV RAG (localhost:7070)...
start "Libraries API :7070" /min cmd /k "cd /d U:\The_DEVz_HUB_of_work\knowledge_base\_LIBRARIES && python api_server.py"
timeout /t 2 /nobreak >nul

:: ===================================================
:: 4. OBSERVABLE FRAMEWORK (port 4300)
:: ===================================================
echo  [4/4]  Observable Framework (localhost:4300)...
start "Observable :4300" /min cmd /k "cd /d U:\JIMBO_NEW_OP_INIT\observable && npm run dev"
timeout /t 3 /nobreak >nul

:: ===================================================
:: OTWÓRZ PRZEGLĄDARKĘ
:: ===================================================
echo.
echo  Czekam na start serwisow...
timeout /t 4 /nobreak >nul

echo  Otwieram dashboard w przegladarce...
start "" "http://localhost:4200"

echo.
echo  ===========================================
echo   SERWISY URUCHOMIONE:
echo.
echo   [DS]  Dashboard       http://localhost:4200
echo   [KB]  KB Server       http://localhost:7071
echo   [LB]  Libraries API   http://localhost:7070
echo   [OB]  Observable      http://localhost:4300
echo.
echo   Aby zatrzymac — zamknij okna terminali
echo   lub uzyj STOP_DASHBOARD.bat
echo  ===========================================
echo.
pause
