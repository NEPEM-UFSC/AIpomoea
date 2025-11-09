# Script para Verificar o Conteúdo do Build
# Simula o que será incluído no executável final

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host "  AIpomoea - Verificação de Conteúdo do Build" -ForegroundColor Magenta
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host ""

# Mudar para a raiz do projeto
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "📦 Arquivos INCLUÍDOS no build:" -ForegroundColor Green
Write-Host ""

# Arquivos da raiz que serão incluídos
$rootFiles = @("main.js", "preload.js", "PythonEnvManager.js", "logger.js", "package.json", "LICENSE.md")
Write-Host "  Raiz do projeto:" -ForegroundColor Cyan
foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length / 1KB
        Write-Host "    ✓ $file" -NoNewline -ForegroundColor Green
        Write-Host " ($('{0:N2}' -f $size) KB)" -ForegroundColor Gray
    } else {
        Write-Host "    ⚠ $file (não encontrado)" -ForegroundColor Yellow
    }
}

# Diretórios incluídos
$includedDirs = @(
    @{Path="views"; Description="Interface HTML"},
    @{Path="static"; Description="CSS, JS, Imagens"},
    @{Path="models"; Description="Modelos ML"}
)

foreach ($dir in $includedDirs) {
    if (Test-Path $dir.Path) {
        $fileCount = (Get-ChildItem -Path $dir.Path -Recurse -File).Count
        $totalSize = (Get-ChildItem -Path $dir.Path -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host ""
        Write-Host "  $($dir.Path)/ - $($dir.Description):" -ForegroundColor Cyan
        Write-Host "    ✓ $fileCount arquivos" -NoNewline -ForegroundColor Green
        Write-Host " ($('{0:N2}' -f $totalSize) MB)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host ""
Write-Host "🔧 Recursos EXTRAS (extraResources):" -ForegroundColor Green
Write-Host ""

# Backend Python (src_python)
if (Test-Path "src_python") {
    $pythonFiles = Get-ChildItem -Path "src_python" -Recurse -File -Exclude "*.test.py","requirements-test.txt","pytest.ini" | Where-Object { $_.Directory.Name -notmatch "tests|test|__pycache__|\.pytest_cache" }
    $pythonSize = ($pythonFiles | Measure-Object -Property Length -Sum).Sum / 1KB
    Write-Host "  backend/src/ (Python):" -ForegroundColor Cyan
    Write-Host "    ✓ $($pythonFiles.Count) arquivos Python" -NoNewline -ForegroundColor Green
    Write-Host " ($('{0:N2}' -f $pythonSize) KB)" -ForegroundColor Gray
}

# Runtime Python (apenas da plataforma atual)
$platform = "win" # Detecta automaticamente
if (Test-Path "runtimes/$platform/python") {
    $runtimeSize = (Get-ChildItem -Path "runtimes/$platform/python" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host ""
    Write-Host "  backend/runtime/ (Python Standalone):" -ForegroundColor Cyan
    Write-Host "    ✓ Python 3.11.14 para $platform" -NoNewline -ForegroundColor Green
    Write-Host " ($('{0:N2}' -f $runtimeSize) MB)" -ForegroundColor Gray
}

Write-Host ""
Write-Host ""
Write-Host "🚫 Arquivos/Pastas EXCLUÍDOS do build:" -ForegroundColor Red
Write-Host ""

# Listar o que será excluído
$excludedItems = @(
    @{Path="tests/"; Reason="Testes unitários e integração"},
    @{Path="documentation/"; Reason="Documentação interna"},
    @{Path="tools/"; Reason="Scripts de desenvolvimento"},
    @{Path="pytest.ini"; Reason="Configuração de testes"},
    @{Path=".github/"; Reason="GitHub Actions"},
    @{Path="node_modules/"; Reason="Dependências (rebuilt pelo electron-builder)"},
    @{Path="*.md"; Reason="Arquivos Markdown"},
    @{Path="todo.txt"; Reason="Lista de tarefas"},
    @{Path="src_python/requirements-test.txt"; Reason="Dependências de teste"},
    @{Path="**/*.test.js"; Reason="Testes JavaScript"},
    @{Path="**/*.test.py"; Reason="Testes Python"},
    @{Path="**/__pycache__/"; Reason="Cache Python"},
    @{Path=".vscode/"; Reason="Configuração do VS Code"}
)

foreach ($item in $excludedItems) {
    $exists = Test-Path $item.Path
    $icon = if ($exists) { "✓" } else { "-" }
    $color = if ($exists) { "Yellow" } else { "DarkGray" }
    Write-Host "  $icon " -NoNewline -ForegroundColor $color
    Write-Host "$($item.Path)" -NoNewline -ForegroundColor $color
    Write-Host " - $($item.Reason)" -ForegroundColor Gray
}

Write-Host ""
Write-Host ""
Write-Host "📊 Resumo Estimado do Build:" -ForegroundColor Cyan
Write-Host ""

# Calcular tamanho total estimado
$totalSize = 0

# Arquivos da raiz
foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        $totalSize += (Get-Item $file).Length
    }
}

# Diretórios incluídos
foreach ($dir in $includedDirs) {
    if (Test-Path $dir.Path) {
        $totalSize += (Get-ChildItem -Path $dir.Path -Recurse -File | Measure-Object -Property Length -Sum).Sum
    }
}

# Python source
if (Test-Path "src_python") {
    $pythonFiles = Get-ChildItem -Path "src_python" -Recurse -File -Exclude "*.test.py","requirements-test.txt","pytest.ini" | Where-Object { $_.Directory.Name -notmatch "tests|test|__pycache__|\.pytest_cache" }
    $totalSize += ($pythonFiles | Measure-Object -Property Length -Sum).Sum
}

# Runtime
if (Test-Path "runtimes/$platform/python") {
    $totalSize += (Get-ChildItem -Path "runtimes/$platform/python" -Recurse -File | Measure-Object -Property Length -Sum).Sum
}

$totalSizeMB = $totalSize / 1MB

Write-Host "  Tamanho total (sem compressão): " -NoNewline
Write-Host "~$('{0:N2}' -f $totalSizeMB) MB" -ForegroundColor Green

Write-Host "  Tamanho após ASAR + compressão: " -NoNewline
Write-Host "~$('{0:N2}' -f ($totalSizeMB * 0.85)) MB" -ForegroundColor Green
Write-Host "    (estimativa com compressão ~15%)" -ForegroundColor Gray

Write-Host ""
Write-Host "  Tamanho final do instalador: " -NoNewline
Write-Host "~$('{0:N2}' -f ($totalSizeMB * 0.75)) MB" -ForegroundColor Green
Write-Host "    (estimativa com compressão NSIS/DMG)" -ForegroundColor Gray

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Gray
Write-Host "✅ Verificação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Dica: Execute 'npm run dist:win' para gerar o build real" -ForegroundColor Cyan
Write-Host ""
