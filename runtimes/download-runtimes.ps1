# Script para Download Automatizado do Python Runtime
# Uso: .\download-runtimes.ps1
# O script detecta automaticamente a plataforma e baixa apenas o runtime necessário

param()

$ErrorActionPreference = "Stop"

# Detectar plataforma atual
function Get-CurrentPlatform {
    if ($IsWindows -or $env:OS -eq "Windows_NT") {
        return "win"
    } elseif ($IsMacOS) {
        return "mac"
    } elseif ($IsLinux) {
        return "linux"
    } else {
        throw "Plataforma não suportada"
    }
}

# Configurações
$PYTHON_VERSION = "3.11.14"
$RELEASE_DATE = "20251031"
$BASE_URL = "https://github.com/indygreg/python-build-standalone/releases/download"

# Definir arquivos para cada plataforma
$Downloads = @{
    win = @{
        url = "$BASE_URL/$RELEASE_DATE/cpython-$PYTHON_VERSION+$RELEASE_DATE-x86_64-pc-windows-msvc-install_only.tar.gz"
        dest = "win\python"
    }
    mac = @{
        url = "$BASE_URL/$RELEASE_DATE/cpython-$PYTHON_VERSION+$RELEASE_DATE-x86_64-apple-darwin-install_only.tar.gz"
        dest = "mac\python"
    }
    linux = @{
        url = "$BASE_URL/$RELEASE_DATE/cpython-$PYTHON_VERSION+$RELEASE_DATE-x86_64-unknown-linux-gnu-install_only.tar.gz"
        dest = "linux\python"
    }
}

# Verifica se o 7-Zip está disponível (apenas Windows)
$sevenZipPath = $null
$currentPlatform = Get-CurrentPlatform

if ($currentPlatform -eq "win") {
    $sevenZipPath = Get-Command 7z -ErrorAction SilentlyContinue
    if (-not $sevenZipPath) {
        Write-Host "[AVISO] 7-Zip (7z.exe) não encontrado no seu PATH." -ForegroundColor Yellow
        Write-Host "         Recomenda-se instalar o 7-Zip para melhor compatibilidade: https://www.7-zip.org/" -ForegroundColor Yellow
        Write-Host "         O script tentará usar 'tar' como alternativa.`n" -ForegroundColor Yellow
    }
}

function Invoke-DownloadAndExtract {
    param(
        [string]$Url,
        [string]$DestPath,
        [string]$PlatformName
    )

    Write-Host "`n==> Baixando Python runtime para $PlatformName..." -ForegroundColor Cyan
    
    $tempFile = Join-Path $env:TEMP "python-$PlatformName.tar.gz"
    $fullDestPath = Join-Path $PSScriptRoot $DestPath

    try {
        # Criar diretório se não existir
        if (Test-Path $fullDestPath) {
            Write-Host "    Removendo runtime antigo..." -ForegroundColor Yellow
            # Tentar remover com várias tentativas para lidar com arquivos travados
            $maxRetries = 3
            $retryCount = 0
            $removed = $false
            
            while (-not $removed -and $retryCount -lt $maxRetries) {
                try {
                    Get-ChildItem -Path $fullDestPath -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction Stop
                    Remove-Item -Path $fullDestPath -Force -Recurse -ErrorAction Stop
                    $removed = $true
                } catch {
                    $retryCount++
                    if ($retryCount -lt $maxRetries) {
                        Write-Host "    Tentando novamente ($retryCount/$maxRetries)..." -ForegroundColor Yellow
                        Start-Sleep -Milliseconds 500
                    } else {
                        throw
                    }
                }
            }
        }
        New-Item -ItemType Directory -Path $fullDestPath -Force | Out-Null

        # Download
        Write-Host "    Baixando de: $Url" -ForegroundColor Gray
        Invoke-WebRequest -Uri $Url -OutFile $tempFile -UseBasicParsing
        Write-Host "    [OK] Download concluido: $('{0:N2}' -f ((Get-Item $tempFile).Length / 1MB)) MB" -ForegroundColor Green

        # Extrair
        Write-Host "    Extraindo arquivos..." -ForegroundColor Gray
        if ($sevenZipPath -and $currentPlatform -eq "win") {
            # Windows com 7-Zip: Criar pasta temporária para extração
            $tempExtractPath = Join-Path $env:TEMP "python-extract-$PlatformName"
            if (Test-Path $tempExtractPath) {
                Remove-Item -Path $tempExtractPath -Recurse -Force
            }
            New-Item -ItemType Directory -Path $tempExtractPath -Force | Out-Null
            
            # Usar 7-Zip para extrair (lida melhor com symlinks em Windows)
            Write-Host "    Extraindo .tar.gz..." -ForegroundColor Gray
            & 7z x $tempFile -so -bsp0 | & 7z x -si -ttar -o"$tempExtractPath" -bsp0 -y | Out-Null
            
            # Mover conteúdo da pasta interna (equivalente ao --strip-components=1)
            $innerFolder = Get-ChildItem -Path $tempExtractPath -Directory | Select-Object -First 1
            if ($innerFolder) {
                Write-Host "    Movendo arquivos de: $($innerFolder.Name)" -ForegroundColor Gray
                # Mover todos os itens (arquivos e pastas) da pasta interna
                Get-ChildItem -Path $innerFolder.FullName -Force | ForEach-Object {
                    $destPath = Join-Path $fullDestPath $_.Name
                    Move-Item -Path $_.FullName -Destination $destPath -Force
                }
            } else {
                # Se não houver pasta interna, mover tudo diretamente
                Write-Host "    Movendo arquivos diretamente" -ForegroundColor Gray
                Get-ChildItem -Path $tempExtractPath -Force | ForEach-Object {
                    $destPath = Join-Path $fullDestPath $_.Name
                    Move-Item -Path $_.FullName -Destination $destPath -Force
                }
            }
            
            # Limpar pasta temporária
            Remove-Item -Path $tempExtractPath -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            # macOS/Linux ou Windows sem 7-Zip: usar tar nativo
            tar -xzf $tempFile -C $fullDestPath --strip-components=1
        }
        Write-Host "    [OK] Extracao concluida" -ForegroundColor Green

        # Limpar
        Remove-Item $tempFile -Force
        Write-Host "    [OK] Runtime instalado em: $DestPath" -ForegroundColor Green

    } catch {
        Write-Host "    [ERRO] Erro ao processar ${PlatformName}: $_" -ForegroundColor Red
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
        throw
    }
}

# Banner
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host "  AIpomoea - Download de Python Runtime" -ForegroundColor Magenta
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host ""

# Verificar se estamos na pasta correta
if (-not (Test-Path (Join-Path $PSScriptRoot "README.txt"))) {
    Write-Host "[ERRO] Execute este script da pasta 'runtimes/'" -ForegroundColor Red
    exit 1
}

# Detectar plataforma
$platformNames = @{
    win = "Windows"
    mac = "macOS"
    linux = "Linux"
}

Write-Host "Plataforma detectada: $($platformNames[$currentPlatform])" -ForegroundColor Cyan
Write-Host "Baixando apenas o runtime necessario para esta plataforma`n" -ForegroundColor Yellow

# Executar download
$success = $false

try {
    Invoke-DownloadAndExtract -Url $Downloads[$currentPlatform].url -DestPath $Downloads[$currentPlatform].dest -PlatformName $currentPlatform
    $success = $true
} catch {
    Write-Host "`n[ERRO] Falha ao baixar runtime: $_" -ForegroundColor Red
}

# Sumário
Write-Host ""
Write-Host ("=" * 55) -ForegroundColor Gray
if ($success) {
    Write-Host "[OK] Runtime instalado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Falha na instalacao do runtime" -ForegroundColor Red
}
Write-Host ("=" * 55) -ForegroundColor Gray

# Executar verificação
if ($success) {
    Write-Host "`nExecutando verificacao..." -ForegroundColor Cyan
    & "$PSScriptRoot\verify-runtimes.ps1"
}

Write-Host "`n[OK] Processo concluido!`n" -ForegroundColor Green
