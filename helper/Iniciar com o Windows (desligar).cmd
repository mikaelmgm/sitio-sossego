@echo off
rem Remove o inicio automatico e fecha o ajudante de volume.
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v SitioSossegoVolume /f
taskkill /im SitioVolume.exe /f >nul 2>&1
echo Pronto: o ajudante nao inicia mais com o Windows.
pause
