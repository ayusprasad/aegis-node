@echo off
setlocal
set "AEGISNODE_REPO=%~dp0..\.."
node "%AEGISNODE_REPO%\packages\cli\dist\bin\aegisnode.js" %*
exit /b %ERRORLEVEL%
