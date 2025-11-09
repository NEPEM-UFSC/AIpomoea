Write-Host "AIpomoea Test Runner" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

$VENV_PATH = "$PSScriptRoot\..\src_python\venv"
$PYTHON_EXE = "$VENV_PATH\Scripts\python.exe"

if (-not (Test-Path $PYTHON_EXE)) {
    Write-Host "Error: Virtual environment not found at $VENV_PATH" -ForegroundColor Red
    Write-Host "Please set up the Python environment first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Using Python from: $PYTHON_EXE" -ForegroundColor Green
Write-Host ""

$testType = $args[0]

switch ($testType) {
    "smoke" {
        Write-Host "Running Smoke Tests..." -ForegroundColor Yellow
        & $PYTHON_EXE -m pytest tests/test_smoke.py -v
    }
    "unit" {
        Write-Host "Running Unit Tests..." -ForegroundColor Yellow
        & $PYTHON_EXE -m pytest tests/unit/ -v
    }
    "integration" {
        Write-Host "Running Integration Tests..." -ForegroundColor Yellow
        & $PYTHON_EXE -m pytest tests/integration/ -v
    }
    "e2e" {
        Write-Host "Running E2E Tests..." -ForegroundColor Yellow
        & $PYTHON_EXE -m pytest tests/e2e/ -v
    }
    "all" {
        Write-Host "Running All Tests..." -ForegroundColor Yellow
        & $PYTHON_EXE -m pytest tests/ -v
    }
    "coverage" {
        Write-Host "Running Tests with Coverage..." -ForegroundColor Yellow
        & $PYTHON_EXE -m pytest tests/ --cov=src_python --cov-report=html --cov-report=term
        Write-Host ""
        Write-Host "Coverage report generated at: htmlcov/index.html" -ForegroundColor Green
    }
    default {
        Write-Host "Usage: .\run-tests.ps1 [smoke|unit|integration|e2e|all|coverage]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Cyan
        Write-Host "  .\run-tests.ps1 smoke       - Run smoke tests only"
        Write-Host "  .\run-tests.ps1 unit        - Run unit tests only"
        Write-Host "  .\run-tests.ps1 all         - Run all tests"
        Write-Host "  .\run-tests.ps1 coverage    - Run with coverage report"
    }
}
