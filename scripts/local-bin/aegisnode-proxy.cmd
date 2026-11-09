@echo off
setlocal
set "AEGISNODE_REPO=%~dp0..\.."
node "%AEGISNODE_REPO%\packages\cli\dist\bin\proxy.js" %*
exit /b %ERRORLEVEL%
