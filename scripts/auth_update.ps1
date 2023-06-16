. ./loadenv.ps1

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
  # fallback to python3 if python not found
  $pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue
}

Write-Host 'Running "auth_update.py"'
Start-Process -FilePath ($pythonCmd).Source -ArgumentList "./scripts/auth_update.py --appid $env:AUTH_APP_ID --uri $env:BACKEND_URI" -Wait -NoNewWindow
