# Script para Verificar Instalação do Python Runtime
# Uso: .\verify-runtimes.ps1
# Verifica apenas o runtime da plataforma Windows

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host "  AIpomoea - Verificacao de Python Runtime" -ForegroundColor Magenta
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host ""

# Verificar se estamos na pasta correta
if (-not (Test-Path (Join-Path $PSScriptRoot "README.txt"))) {
    Write-Host "[ERRO] Execute este script da pasta 'runtimes/'" -ForegroundColor Red
    exit 1
}

# Verificar apenas o runtime do Windows (plataforma atual)
$runtime = @{
    path = "win\python\python.exe"
    name = "Windows"
}

$fullPath = Join-Path $PSScriptRoot $runtime.path

Write-Host "[Windows]" -ForegroundColor Cyan -NoNewline
Write-Host " Verificando..." -NoNewline

if (Test-Path $fullPath) {
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "  Localizacao: $($runtime.path)" -ForegroundColor Gray
    
    # Obter versão
    try {
        $version = & $fullPath --version 2>&1
        Write-Host "  Versao     : $version" -ForegroundColor Gray
    } catch {
        Write-Host "  Versao     : (nao foi possivel verificar)" -ForegroundColor Yellow
    }
    
    # Verificar tamanho
    $dirSize = (Get-ChildItem -Path (Split-Path $fullPath) -Recurse | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($dirSize / 1MB, 2)
    Write-Host "  Tamanho    : $sizeMB MB" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host ("=" * 55) -ForegroundColor Gray
    Write-Host "[OK] Runtime instalado corretamente!" -ForegroundColor Green
    Write-Host ("=" * 55) -ForegroundColor Gray
    Write-Host ""
    exit 0
} else {
    Write-Host " [NAO ENCONTRADO]" -ForegroundColor Red
    Write-Host "  Esperado em: $($runtime.path)" -ForegroundColor Gray
    Write-Host ""
    Write-Host ("=" * 55) -ForegroundColor Gray
    Write-Host "[ERRO] Runtime nao encontrado" -ForegroundColor Red
    Write-Host ("=" * 55) -ForegroundColor Gray
    Write-Host ""
    Write-Host "Para baixar o runtime, execute:" -ForegroundColor Yellow
    Write-Host "   .\download-runtimes.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
