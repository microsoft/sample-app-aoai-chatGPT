. ./loadenv.ps1

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
  # fallback to python3 if python not found
  $pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue
}

Write-Host 'Running "auth_init.py"'
Start-Process -FilePath ($pythonCmd).Source -ArgumentList "./scripts/auth_init.py --appid $env:AUTH_APP_ID" -Wait -NoNewWindow
