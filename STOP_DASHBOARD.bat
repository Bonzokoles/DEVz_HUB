@echo off
title DEVz HUB — STOP
color 0C
cls

echo.
echo  ===========================================
echo   DEVz HUB — ZATRZYMYWANIE SERWISOW
echo  ===========================================
echo.

:: Zamknij okna po tytule
echo  Zamykam: DEVz HUB Dashboard...
taskkill /FI "WINDOWTITLE eq DEVz HUB Dashboard*" /F >nul 2>&1

echo  Zamykam: KB Server :7071...
taskkill /FI "WINDOWTITLE eq KB Server :7071*" /F >nul 2>&1

echo  Zamykam: Libraries API :7070...
taskkill /FI "WINDOWTITLE eq Libraries API :7070*" /F >nul 2>&1

echo  Zamykam: Observable :4300...
taskkill /FI "WINDOWTITLE eq Observable :4300*" /F >nul 2>&1

:: Zabij procesy na portach (bezpieczne)
echo  Czyszcze porty 4200, 7070, 7071, 4300...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4200 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":7071 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":7070 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4300 " 2^>nul') do taskkill /PID %%a /F >nul 2>&1

echo.
echo   Wszystkie serwisy zatrzymane.
echo.
pause
