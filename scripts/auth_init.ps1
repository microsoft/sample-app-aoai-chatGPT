. ./scripts/loadenv.ps1

$venvPythonPath = "./.venv/scripts/python.exe"
if (Test-Path -Path "/usr") {
  # fallback to Linux venv path
  $venvPythonPath = "./.venv/bin/python"
}

Write-Host 'Running "auth_init.py"'
$appId = $env:AUTH_APP_ID ?? "no-id"
Start-Process -FilePath $venvPythonPath -ArgumentList "./scripts/auth_init.py --appid $appId" -Wait -NoNewWindow
