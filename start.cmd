@echo off
setlocal
REM Sample app startup script

REM Process CLI options
set CMD=%~1
if "%CMD%" == "" (
    echo Building the application.  To skip this step in the future, use the `--skip-build` option.
    goto build
) else if "%CMD%" == "--skip-build" (
    echo Skipping build...
    goto run
)

:build
set NODE_OPTIONS=--max_old_space_size=8192

echo.
echo Restoring backend python packages
echo.
call python -m pip install -r requirements.txt
if "%errorlevel%" neq "0" (
    echo Failed to restore backend python packages
    exit /B %errorlevel%
)

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
echo Building frontend
echo.
call npm run build
if "%errorlevel%" neq "0" (
    echo Failed to build frontend
    exit /B %errorlevel%
)

:run
echo.    
echo Starting backend    
echo.    
cd ..  
start http://127.0.0.1:50505
call python -m uvicorn app:app  --port 50505 --reload
if "%errorlevel%" neq "0" (    
    echo Failed to start backend    
    exit /B %errorlevel%    
) 
