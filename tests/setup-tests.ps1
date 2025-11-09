Write-Host "Setting up Test Environment" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

$VENV_PATH = "$PSScriptRoot\..\src_python\venv"
$PYTHON_EXE = "$VENV_PATH\Scripts\python.exe"
$PIP_EXE = "$VENV_PATH\Scripts\pip.exe"

if (-not (Test-Path $PYTHON_EXE)) {
    Write-Host "Error: Virtual environment not found at $VENV_PATH" -ForegroundColor Red
    Write-Host "Please run the application first to create the venv." -ForegroundColor Yellow
    exit 1
}

Write-Host "Installing test dependencies..." -ForegroundColor Yellow
& $PIP_EXE install -r "$PSScriptRoot\..\src_python\requirements-test.txt"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Test environment setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run tests with:" -ForegroundColor Cyan
    Write-Host "  .\tests\run-tests.ps1 smoke" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ Failed to install test dependencies" -ForegroundColor Red
    exit 1
}
