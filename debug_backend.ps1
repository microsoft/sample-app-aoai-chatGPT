Write-Host 'Creating python virtual environment ".venv"'
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
  # fallback to python3 if python not found
  $pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue
}
Start-Process -FilePath ($pythonCmd).Source -ArgumentList "-m venv .venv" -Wait -NoNewWindow

Write-Host ""
Write-Host "Restoring backend python packages"
Write-Host ""

$venvPythonPath = "./.venv/scripts/python.exe"
if (Test-Path -Path "/usr") {
  # fallback to Linux venv path
  $venvPythonPath = "./.venv/bin/python"
}

Start-Process -FilePath $venvPythonPath -ArgumentList "-m pip install -r requirements.txt" -Wait -NoNewWindow
# if ($LASTEXITCODE -ne 0) {
#     Write-Host "Failed to restore backend python packages"
#     exit $LASTEXITCODE
# }


Write-Host ""
Write-Host "Starting backend"
Write-Host ""
# Start-Process http://127.0.0.1:5000
Start-Process -FilePath $venvPythonPath -ArgumentList "-m flask --app ./app.py --debug run" -Wait -NoNewWindow

# if ($LASTEXITCODE -ne 0) {
#     Write-Host "Failed to start backend"
#     exit $LASTEXITCODE
# }