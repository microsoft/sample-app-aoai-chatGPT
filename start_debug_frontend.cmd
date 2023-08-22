@echo off

echo.
echo Restoring frontend npm packages
echo.
cd frontend
call npm install
if "%errorlevel%" neq "0" (
    echo Failed to restore frontend npm packages
    exit /B %errorlevel%
)

echo.
echo Starting frontend in dev mode
echo.
call npm run dev
if "%errorlevel%" neq "0" (
    echo Failed to build frontend
    exit /B %errorlevel%
)