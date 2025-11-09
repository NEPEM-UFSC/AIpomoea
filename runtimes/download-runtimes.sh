#!/bin/bash
# Script para Download Automatizado do Python Runtime
# Uso: ./download-runtimes.sh
# O script detecta automaticamente a plataforma e baixa apenas o runtime necessário

set -e

# Configurações
PYTHON_VERSION="3.11.14"
RELEASE_DATE="20251031"
BASE_URL="https://github.com/indygreg/python-build-standalone/releases/download"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Detectar plataforma atual
detect_platform() {
    local os_type=$(uname -s)
    case "$os_type" in
        Darwin*)
            echo "mac"
            ;;
        Linux*)
            echo "linux"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Função para download e extração
download_and_extract() {
    local platform=$1
    local url=$2
    local dest_path=$3
    
    echo -e "\n${CYAN}==> Baixando Python runtime para $platform...${NC}"
    
    local temp_file="/tmp/python-$platform.tar.gz"
    local full_dest_path="$(cd "$(dirname "$0")" && pwd)/$dest_path"
    
    # Remover runtime antigo se existir
    if [ -d "$full_dest_path" ]; then
        echo -e "    ${YELLOW}Removendo runtime antigo...${NC}"
        rm -rf "$full_dest_path"
    fi
    mkdir -p "$full_dest_path"
    
    # Download
    echo -e "    ${GRAY}Baixando de: $url${NC}"
    if command -v curl &> /dev/null; then
        curl -L -o "$temp_file" "$url" --progress-bar
    elif command -v wget &> /dev/null; then
        wget -O "$temp_file" "$url" -q --show-progress
    else
        echo -e "    ${RED}[ERRO] Nem curl nem wget estão disponíveis${NC}"
        return 1
    fi
    
    local file_size=$(du -h "$temp_file" | cut -f1)
    echo -e "    ${GREEN}[OK] Download concluído: $file_size${NC}"
    
    # Extrair
    echo -e "    ${GRAY}Extraindo arquivos...${NC}"
    tar -xzf "$temp_file" -C "$full_dest_path" --strip-components=1
    echo -e "    ${GREEN}[OK] Extração concluída${NC}"
    
    # Limpar
    rm -f "$temp_file"
    echo -e "    ${GREEN}[OK] Runtime instalado em: $dest_path${NC}"
    
    return 0
}

# Banner
echo ""
echo -e "${MAGENTA}=======================================================${NC}"
echo -e "${MAGENTA}  AIpomoea - Download de Python Runtime${NC}"
echo -e "${MAGENTA}=======================================================${NC}"
echo ""

# Verificar se estamos na pasta correta
script_dir="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$script_dir/README.txt" ]; then
    echo -e "${RED}[ERRO] Execute este script da pasta 'runtimes/'${NC}"
    exit 1
fi

# Detectar plataforma
platform=$(detect_platform)

if [ "$platform" = "unknown" ]; then
    echo -e "${RED}[ERRO] Plataforma não suportada: $(uname -s)${NC}"
    exit 1
fi

# Definir URLs e destinos
case "$platform" in
    mac)
        platform_name="macOS"
        url="$BASE_URL/$RELEASE_DATE/cpython-$PYTHON_VERSION+$RELEASE_DATE-x86_64-apple-darwin-install_only.tar.gz"
        dest="mac/python"
        ;;
    linux)
        platform_name="Linux"
        url="$BASE_URL/$RELEASE_DATE/cpython-$PYTHON_VERSION+$RELEASE_DATE-x86_64-unknown-linux-gnu-install_only.tar.gz"
        dest="linux/python"
        ;;
esac

echo -e "${CYAN}Plataforma detectada: $platform_name${NC}"
echo -e "${YELLOW}Baixando apenas o runtime necessário para esta plataforma${NC}"
echo ""

# Executar download
success=false
if download_and_extract "$platform" "$url" "$dest"; then
    success=true
fi

# Sumário
echo ""
echo -e "${GRAY}=======================================================${NC}"
if [ "$success" = true ]; then
    echo -e "${GREEN}[OK] Runtime instalado com sucesso!${NC}"
else
    echo -e "${RED}[ERRO] Falha na instalação do runtime${NC}"
    exit 1
fi
echo -e "${GRAY}=======================================================${NC}"

# Executar verificação
if [ "$success" = true ] && [ -f "$script_dir/verify-runtimes.sh" ]; then
    echo -e "\n${CYAN}Executando verificação...${NC}"
    bash "$script_dir/verify-runtimes.sh"
fi

echo -e "\n${GREEN}[OK] Processo concluído!${NC}\n"
