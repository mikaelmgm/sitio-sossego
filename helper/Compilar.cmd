@echo off
rem Compila o ajudante de volume com o compilador C# que ja vem no Windows (.NET Framework 4).
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe
"%CSC%" /nologo /target:winexe /optimize+ "/out:%~dp0SitioVolume.exe" "%~dp0SitioVolume.cs"
if errorlevel 1 (echo Falhou ao compilar.) else (echo Pronto: SitioVolume.exe criado. Agora rode "Ligar volume.cmd".)
pause
