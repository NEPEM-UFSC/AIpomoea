# ============================================================================
# SCRIPT: validate-runtimes.ps1
# DESCRIPTION: Valida que os runtimes Python estão presentes antes do build
# USAGE: .\scripts\validate-runtimes.ps1
# ============================================================================

Write-Host "🔍 Validando runtimes Python..." -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
$runtimesDir = Join-Path $rootDir "runtimes"

# Plataformas esperadas
$platforms = @("win", "linux", "mac")
$allValid = $true

foreach ($platform in $platforms) {
    $platformPath = Join-Path $runtimesDir $platform
    $pythonPath = Join-Path $platformPath "python"
    
    Write-Host "`n📦 Verificando runtime: $platform" -ForegroundColor Yellow
    
    if (Test-Path $pythonPath) {
        # Verifica se há arquivos dentro
        $fileCount = (Get-ChildItem -Path $pythonPath -Recurse -File | Measure-Object).Count
        
        if ($fileCount -gt 0) {
            Write-Host "   ✅ Runtime presente ($fileCount arquivos)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Runtime vazio (0 arquivos)" -ForegroundColor Red
            $allValid = $false
        }
    } else {
        Write-Host "   ❌ Runtime não encontrado em: $pythonPath" -ForegroundColor Red
        $allValid = $false
    }
}

Write-Host "`n" -NoNewline

if ($allValid) {
    Write-Host "✅ VALIDAÇÃO COMPLETA: Todos os runtimes estão presentes!" -ForegroundColor Green
    Write-Host "   Você pode prosseguir com o build usando 'npm run build'" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "❌ VALIDAÇÃO FALHOU: Runtimes faltando!" -ForegroundColor Red
    Write-Host "   Execute os seguintes comandos antes do build:" -ForegroundColor Yellow
    Write-Host "   1. cd runtimes" -ForegroundColor White
    Write-Host "   2. .\download-runtimes.ps1" -ForegroundColor White
    Write-Host "   3. cd .." -ForegroundColor White
    Write-Host "   4. npm run build" -ForegroundColor White
    exit 1
}
