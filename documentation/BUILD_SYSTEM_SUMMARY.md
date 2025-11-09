# 🎉 Sistema de Build e Release Automatizado - Configurado

## ✅ O Que Foi Implementado

### 1. **GitHub Actions Workflow** (`.github/workflows/release.yml`)

Um workflow completo que:

- ✅ Executa em **3 plataformas simultaneamente** (Windows, macOS, Linux)
- ✅ Baixa automaticamente o **runtime Python específico** de cada plataforma
- ✅ Executa **testes** antes de buildar
- ✅ Gera os **executáveis** para distribuição
- ✅ Cria **release automático** com todos os builds anexados

### 2. **Scripts de Download Automático**

#### Windows (`download-runtimes.ps1`)

- Detecta automaticamente Windows
- Baixa Python 3.11.14 para Windows
- Usa 7-Zip quando disponível
- Fallback para tar nativo

#### macOS/Linux (`download-runtimes.sh`)

- Detecta automaticamente macOS ou Linux
- Baixa Python 3.11.14 correspondente
- Usa tar nativo (perfeito para symlinks)
- Executa verificação automática

### 3. **Scripts de Verificação**

#### Windows (`verify-runtimes.ps1`)

- Verifica instalação do runtime Windows
- Mostra versão e tamanho
- Retorna exit code apropriado

#### macOS/Linux (`verify-runtimes.sh`)

- Verifica runtime da plataforma atual
- Mostra versão e tamanho
- Formato consistente com Windows

### 4. **Configuração do Electron Builder**

#### `package.json` - Comandos Adicionados

```json
"dist:mac": "electron-builder --mac",
"build:mac": "npm run dist:mac"
```

#### `package.json` - Configuração macOS

- ✅ Target: DMG e ZIP
- ✅ Suporte Intel (x64) e Apple Silicon (arm64)
- ✅ Entitlements configurados
- ✅ Categoria: Education

#### `package.json` - Otimizações

- ✅ `extraResources` ajustado para cada plataforma
- ✅ Runtime Python incluído automaticamente
- ✅ Backend Python empacotado

### 5. **Arquivos de Build**

#### `build/entitlements.mac.plist`

- Permissões necessárias para macOS
- JIT e execução de código não assinado
- Validação de biblioteca desabilitada

#### `build/installer.nsh`

- Script NSIS personalizado para Windows
- Macros para instalação/desinstalação customizada

### 6. **Documentação**

#### `documentation/BUILD_RELEASE_GUIDE.md`

- Guia completo de como criar releases
- Passo a passo detalhado
- Solução de problemas comuns
- Checklist antes do release

#### `runtimes/USAGE.md`

- Explicação de quando usar os scripts
- Por que não baixar todos os runtimes
- Como funciona o build multi-plataforma

#### `runtimes/README.md`

- Atualizado para destacar que é automático
- Instruções apenas para teste local

#### `README.md` (principal)

- Badge do workflow de release
- Seção de download com links diretos
- Links para releases mais recentes

## 🚀 Como Usar (Para Criar um Release)

### Método Simples (Recomendado)

```bash
# 1. Atualizar versão
# Edite package.json: "version": "1.4.0"

# 2. Commit
git add .
git commit -m "chore: bump version to 1.4.0"

# 3. Criar tag
git tag v1.4.0

# 4. Push
git push origin main
git push origin v1.4.0
```

✅ **Pronto!** GitHub Actions faz o resto.

### O Que Acontece Automaticamente

1. **Workflow detecta a tag** `v1.4.0`
2. **3 runners iniciam em paralelo:**

   **Windows Runner:**
   - Instala Node.js e Python
   - Executa `download-runtimes.ps1`
   - Baixa runtime Windows (~150 MB)
   - Executa testes
   - Gera: `AIpomoea-Setup-1.4.0.exe` + versão portátil

   **macOS Runner:**
   - Instala Node.js e Python
   - Executa `download-runtimes.sh`
   - Baixa runtime macOS (~130 MB)
   - Executa testes
   - Gera: `AIpomoea-1.4.0.dmg` + `.zip`

   **Linux Runner:**
   - Instala Node.js e Python
   - Executa `download-runtimes.sh`
   - Baixa runtime Linux (~130 MB)
   - Executa testes
   - Gera: `AIpomoea-1.4.0.AppImage` + `.deb`

3. **Release criado automaticamente** em:
   `https://github.com/NEPEM-UFSC/AIpomoea/releases/tag/v1.4.0`

4. **Todos os 5+ arquivos** são anexados ao release

## 📦 Estrutura dos Builds

### Windows

```
AIpomoea-Setup-1.4.0.exe         (~180 MB)
AIpomoea-1.4.0-Portable.exe      (~180 MB)
```

### macOS

```
AIpomoea-1.4.0.dmg               (~150 MB)
AIpomoea-1.4.0-mac.zip           (~150 MB)
```

### Linux

```
AIpomoea-1.4.0.AppImage          (~150 MB)
aipomoea_1.4.0_amd64.deb         (~150 MB)
```

## ⏱️ Tempo de Build

- Cada plataforma: ~10-15 minutos
- **Total (paralelo): ~15-20 minutos**

## 🧪 Teste Local (Opcional)

Se quiser testar o build antes de criar o release:

### Windows

```powershell
cd runtimes
.\download-runtimes.ps1
cd ..
npm run dist:win
```

### macOS

```bash
cd runtimes
chmod +x download-runtimes.sh
./download-runtimes.sh
cd ..
npm run dist:mac
```

### Linux

```bash
cd runtimes
chmod +x download-runtimes.sh
./download-runtimes.sh
cd ..
npm run dist:linux
```

⚠️ **Limitação:** Você só pode buildar para a plataforma em que está!

## 🔍 Monitoramento

Acompanhe o build em tempo real:

1. Acesse: `https://github.com/NEPEM-UFSC/AIpomoea/actions`
2. Clique no workflow "Build & Release"
3. Veja os logs de cada plataforma

## 🎯 Vantagens Desta Solução

✅ **Totalmente Automático**

- Zero configuração manual pelos desenvolvedores
- Não precisa instalar runtimes localmente
- Não precisa ter macOS para buildar para macOS

✅ **Eficiente**

- Builds paralelos (3 plataformas ao mesmo tempo)
- Cada runner baixa apenas o que precisa
- Cache de dependências npm

✅ **Confiável**

- Ambiente limpo a cada build
- Testes executados antes do build
- Verificação de runtime integrada

✅ **Completo**

- Gera todos os formatos: exe, dmg, AppImage, deb
- Suporte Intel e Apple Silicon no macOS
- 32 e 64 bits no Windows

✅ **Documentado**

- Guias detalhados para cada cenário
- Solução de problemas
- Checklist antes do release

## 📝 Próximos Passos

### Para Criar Seu Primeiro Release

1. **Teste localmente** (opcional)
2. **Atualize a versão** no `package.json`
3. **Crie a tag**: `git tag v1.4.0`
4. **Push**: `git push origin main && git push origin v1.4.0`
5. **Aguarde** ~15-20 minutos
6. **Acesse** `https://github.com/NEPEM-UFSC/AIpomoea/releases`
7. **Baixe e teste** os executáveis

### Para Assinatura de Código (Futuro)

Se quiser assinar os executáveis (recomendado para produção):

**Windows:**

- Obtenha certificado Code Signing
- Adicione `WINDOWS_CSC_LINK` e `WINDOWS_CSC_KEY_PASSWORD` nos secrets

**macOS:**

- Entre no Apple Developer Program
- Adicione `APPLE_ID`, `APPLE_ID_PASSWORD`, `CSC_LINK` nos secrets

## 🐛 Problemas Conhecidos

### ⚠️ macOS: "App is damaged"

- **Causa:** App não está assinado
- **Solução usuário:** Clique com botão direito → Abrir
- **Solução permanente:** Configure assinatura de código

### ⚠️ Windows: SmartScreen

- **Causa:** App não está assinado
- **Solução usuário:** Clique em "Mais informações" → "Executar assim mesmo"
- **Solução permanente:** Configure assinatura de código

### ⚠️ Linux: Permissão negada

- **Causa:** AppImage sem permissão de execução
- **Solução usuário:** `chmod +x AIpomoea-1.4.0.AppImage`

## 🔗 Links Importantes

- **Releases:** <https://github.com/NEPEM-UFSC/AIpomoea/releases>
- **Actions:** <https://github.com/NEPEM-UFSC/AIpomoea/actions>
- **Issues:** <https://github.com/NEPEM-UFSC/AIpomoea/issues>

## ✨ Status

🎉 **SISTEMA TOTALMENTE CONFIGURADO E PRONTO PARA USO!**

Você pode criar seu primeiro release agora mesmo seguindo os passos acima.
