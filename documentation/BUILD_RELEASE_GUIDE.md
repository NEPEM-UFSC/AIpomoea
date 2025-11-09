# 🚀 Guia de Build e Release - AIpomoea

## 📋 Visão Geral

O AIpomoea usa **GitHub Actions** para gerar automaticamente os builds para Windows, macOS e Linux. Não é necessário configurar runtimes localmente para criar releases.

## 🎯 Processo Automatizado

### Como Funciona

1. **Desenvolvedor cria uma tag de versão** (ex: `v1.3.0`)
2. **GitHub Actions é acionado automaticamente**
3. **Três runners paralelos** (Windows, macOS, Linux):
   - Baixam o runtime Python específico da plataforma
   - Instalam dependências
   - Executam testes
   - Geram os executáveis
4. **Release automático** com todos os builds anexados

## 🏗️ Como Criar um Release

### Opção 1: Via Tag Git (Recomendado)

```bash
# 1. Atualizar versão no package.json
# Edite manualmente: "version": "1.4.0"

# 2. Commit das mudanças
git add .
git commit -m "chore: bump version to 1.4.0"

# 3. Criar tag
git tag v1.4.0

# 4. Push do commit e da tag
git push origin main
git push origin v1.4.0
```

✅ **O workflow será executado automaticamente!**

### Opção 2: Via GitHub Interface

1. Acesse: `https://github.com/NEPEM-UFSC/AIpomoea/releases/new`
2. Clique em "Choose a tag" → Digite `v1.4.0` → "Create new tag"
3. Preencha o título: `AIpomoea v1.4.0`
4. Adicione descrição das mudanças
5. Clique em "Publish release"

✅ **O workflow será executado automaticamente!**

### Opção 3: Execução Manual

1. Acesse: `https://github.com/NEPEM-UFSC/AIpomoea/actions/workflows/release.yml`
2. Clique em "Run workflow"
3. Selecione a branch `main`
4. Clique em "Run workflow"

⚠️ **Nota:** Builds manuais não criam release automaticamente, apenas geram os artifacts.

## 📦 O Que é Gerado

### Windows

- `AIpomoea-Setup-1.4.0.exe` - Instalador NSIS (64-bit e 32-bit)
- `AIpomoea-1.4.0-Portable.exe` - Versão portátil (64-bit)

### macOS

- `AIpomoea-1.4.0.dmg` - Instalador DMG (Intel e Apple Silicon)
- `AIpomoea-1.4.0-mac.zip` - Versão zipada

### Linux

- `AIpomoea-1.4.0.AppImage` - AppImage universal (64-bit)
- `AIpomoea_1.4.0_amd64.deb` - Pacote Debian/Ubuntu

## 🔍 Acompanhar o Build

1. Acesse: `https://github.com/NEPEM-UFSC/AIpomoea/actions`
2. Clique no workflow "Build & Release"
3. Acompanhe os logs de cada plataforma

### Tempos Estimados

- ⏱️ Windows: ~10-15 minutos
- ⏱️ macOS: ~10-15 minutos
- ⏱️ Linux: ~8-12 minutos
- ⏱️ **Total**: ~15-20 minutos (paralelo)

## 🐛 Solução de Problemas

### Build Falha no Download do Runtime

**Erro:** `Failed to download Python runtime`

**Solução:**

- Verifique se os scripts `download-runtimes.ps1` e `download-runtimes.sh` existem
- Confirme que a URL do Python build está correta
- Teste os scripts localmente

### Build Falha no Electron Builder

**Erro:** `Cannot find module 'runtimes/win/python/python.exe'`

**Solução:**

- Verifique a configuração `extraResources` no `package.json`
- Confirme que o runtime foi baixado corretamente
- Verifique os logs do passo "Verify Runtime Installation"

### macOS: Code Signing Failed

**Erro:** `Code signing failed`

**Solução:**

- É esperado se não houver certificado configurado
- O build continua e gera o .dmg não assinado
- Para produção, configure `CSC_LINK` e `CSC_KEY_PASSWORD` nos secrets

## 🔐 Assinatura de Código (Opcional)

### Windows

Para assinar o executável no Windows, adicione nos secrets do GitHub:

```
WINDOWS_CSC_LINK=<base64 do certificado .pfx>
WINDOWS_CSC_KEY_PASSWORD=<senha do certificado>
```

### macOS

Para assinar o .dmg no macOS, adicione nos secrets:

```
APPLE_ID=<seu Apple ID>
APPLE_ID_PASSWORD=<app-specific password>
CSC_LINK=<base64 do certificado>
CSC_KEY_PASSWORD=<senha do certificado>
```

## 📝 Checklist Antes do Release

- [ ] Versão atualizada no `package.json`
- [ ] CHANGELOG.md atualizado (se existir)
- [ ] Testes locais passando
- [ ] README.md atualizado (se necessário)
- [ ] Screenshots/documentação atualizados (se necessário)
- [ ] Branch `main` está estável

## 🎉 Após o Release

1. **Verificar os Assets**
   - Acesse a página do release
   - Confirme que todos os 5+ arquivos estão presentes
   - Teste o download de pelo menos um arquivo

2. **Divulgação**
   - Anuncie no README principal
   - Atualize links de download
   - Notifique os usuários

3. **Monitoramento**
   - Acompanhe issues relacionadas ao release
   - Verifique relatórios de erro
   - Prepare hotfixes se necessário

## 🔄 Hotfix Rápido

Se precisar corrigir um bug crítico:

```bash
# 1. Fix do bug
git add .
git commit -m "fix: critical bug in version 1.4.0"

# 2. Nova versão patch
# Edite package.json: "version": "1.4.1"

# 3. Nova tag
git tag v1.4.1
git push origin main
git push origin v1.4.1
```

## 📊 Estatísticas de Download

Para ver quantos downloads cada release teve:

1. Acesse: `https://github.com/NEPEM-UFSC/AIpomoea/releases`
2. Role até o release desejado
3. As contagens aparecem ao lado de cada asset

## 🤝 Contribuindo com Builds

Se você quiser testar o build localmente antes do release:

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

⚠️ **Nota:** Você só pode buildar para a plataforma em que está executando!

## 🔗 Links Úteis

- [Electron Builder Docs](https://www.electron.build/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Python Standalone Builds](https://github.com/indygreg/python-build-standalone)
- [Semantic Versioning](https://semver.org/)

## 📞 Suporte

Problemas com o processo de build?

- Abra uma issue: `https://github.com/NEPEM-UFSC/AIpomoea/issues/new`
- Inclua os logs do GitHub Actions
- Descreva a tag/versão que tentou gerar
