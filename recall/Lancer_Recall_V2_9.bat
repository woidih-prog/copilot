@echo off
cd /d "%~dp0"
title Recall V2.9 - Classement
echo Demarrage de Recall...
py -m uvicorn app:app --host 127.0.0.1 --port 8000
pause
