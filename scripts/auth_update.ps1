. ./scripts/loadenv.ps1

$venvPythonPath = "./.venv/scripts/python.exe"
if (Test-Path -Path "/usr") {
  # fallback to Linux venv path
  $venvPythonPath = "./.venv/bin/python"
}

Write-Host 'Running "auth_update.py"'
Start-Process -FilePath $venvPythonPath -ArgumentList "./scripts/auth_update.py --appid $env:AUTH_APP_ID --uri $env:BACKEND_URI" -Wait -NoNewWindow
