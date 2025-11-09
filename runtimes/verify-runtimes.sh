#!/bin/bash
# Script para Verificar Instalação do Python Runtime
# Uso: ./verify-runtimes.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo ""
echo -e "${MAGENTA}=======================================================${NC}"
echo -e "${MAGENTA}  AIpomoea - Verificação de Python Runtime${NC}"
echo -e "${MAGENTA}=======================================================${NC}"
echo ""

# Verificar se estamos na pasta correta
script_dir="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$script_dir/README.txt" ]; then
    echo -e "${RED}[ERRO] Execute este script da pasta 'runtimes/'${NC}"
    exit 1
fi

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

platform=$(detect_platform)

# Definir runtime baseado na plataforma
case "$platform" in
    mac)
        platform_name="macOS"
        runtime_path="mac/python/bin/python"
        ;;
    linux)
        platform_name="Linux"
        runtime_path="linux/python/bin/python"
        ;;
    *)
        echo -e "${RED}[ERRO] Plataforma não suportada: $(uname -s)${NC}"
        exit 1
        ;;
esac

full_path="$script_dir/$runtime_path"

echo -e "${CYAN}[$platform_name]${NC} Verificando... "

if [ -f "$full_path" ]; then
    echo -e "${GREEN}[OK]${NC}"
    echo -e "  ${GRAY}Localização: $runtime_path${NC}"
    
    # Obter versão
    if [ -x "$full_path" ]; then
        version=$("$full_path" --version 2>&1)
        echo -e "  ${GRAY}Versão     : $version${NC}"
    fi
    
    # Verificar tamanho
    runtime_dir=$(dirname "$full_path")
    if [ -d "$runtime_dir" ]; then
        size=$(du -sh "$runtime_dir" 2>/dev/null | cut -f1)
        echo -e "  ${GRAY}Tamanho    : $size${NC}"
    fi
    
    echo ""
    echo -e "${GRAY}=======================================================${NC}"
    echo -e "${GREEN}[OK] Runtime instalado corretamente!${NC}"
    echo -e "${GRAY}=======================================================${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}[NÃO ENCONTRADO]${NC}"
    echo -e "  ${GRAY}Esperado em: $runtime_path${NC}"
    echo ""
    echo -e "${GRAY}=======================================================${NC}"
    echo -e "${RED}[ERRO] Runtime não encontrado${NC}"
    echo -e "${GRAY}=======================================================${NC}"
    echo ""
    echo -e "${YELLOW}Para baixar o runtime, execute:${NC}"
    echo -e "${CYAN}   ./download-runtimes.sh${NC}"
    echo ""
    exit 1
fi
