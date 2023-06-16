. ./loadenv.ps1

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
  # fallback to python3 if python not found
  $pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue
}

Write-Host 'Running "prepdocs.py"'
$cwd = (Get-Location)
Start-Process -FilePath ($pythonCmd).Source -ArgumentList "./scripts/prepdocs.py --searchservice $env:AZURE_SEARCH_SERVICE --index $env:AZURE_SEARCH_INDEX --formrecognizerservice $env:AZURE_FORMRECOGNIZER_SERVICE --tenantid $env:AZURE_TENANT_ID" -Wait -NoNewWindow
