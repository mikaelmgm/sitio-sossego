@echo off
rem Liga o ajudante de volume do Sitio Sossego (sem janela). Rode de novo se reiniciar o PC.
start "" "%~dp0SitioVolume.exe"
echo Ajudante de volume ligado. Pode fechar esta janela.
timeout /t 3 >nul
