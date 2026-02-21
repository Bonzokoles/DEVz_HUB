@echo off
title JIMBO HQ Dashboard
cd /d "%~dp0"
echo.
echo   Starting JIMBO HQ Dashboard...
echo   http://localhost:4200
echo.
python server.py 4200
pause
