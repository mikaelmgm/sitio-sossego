@echo off
rem Faz o ajudante de volume abrir sozinho quando voce entra no Windows (so para o seu usuario).
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v SitioSossegoVolume /t REG_SZ /d "\"%~dp0SitioVolume.exe\"" /f
start "" "%~dp0SitioVolume.exe"
echo Pronto: o ajudante vai iniciar junto com o Windows.
pause
