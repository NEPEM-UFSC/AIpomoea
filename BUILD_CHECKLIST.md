# ✅ Checklist de Correções Pré-Distribuição

**Data:** 9 de novembro de 2025  
**Prioridade:** CRÍTICA 🔴  
**Tempo Estimado:** 1-2 dias

---

## 🔴 PRIORIDADE 1 - CORREÇÕES CRÍTICAS

### 1. Refatorar Caminhos em main.js

**Arquivo:** `main.js`

**Adicionar constantes (após linha 32):**
```javascript
const PATHS = {
    UPLOADS_DIR: path.join(USER_DATA_PATH, 'uploads'),
    RESULTS_DIR: path.join(USER_DATA_PATH, 'results'),
    LOGS_DIR: path.join(USER_DATA_PATH, 'logs'),
    SESSION_FILE: path.join(USER_DATA_PATH, 'session.json'),
    CONFIG_FILE: path.join(USER_DATA_PATH, 'config.json'),
    // ADICIONAR:
    RECIPE_FILE: path.join(USER_DATA_PATH, 'recipe.json'),
    CUSTOM_PRELOADING_FILE: path.join(USER_DATA_PATH, 'custom_preloading.json'),
    MODELS_JSON_FILE: path.join(USER_DATA_PATH, 'models.json'),
    OLD_SESSION_FILE: path.join(USER_DATA_PATH, 'session.aipomoea')
};
```

#### Substituições Necessárias:

- [ ] **Linha 102:** `path.join(__dirname, 'session.aipomoea')` → `PATHS.OLD_SESSION_FILE`

- [ ] **Linha 294:** `` `${__dirname}/icone.ico` `` → `path.join(__dirname, 'icone.ico')`

- [ ] **Linha 365:** `path.join(__dirname, 'recipe.json')` → `PATHS.RECIPE_FILE`

- [ ] **Linha 366:** `path.join(__dirname, 'custom_preloading.json')` → `PATHS.CUSTOM_PRELOADING_FILE`

- [ ] **Linha 367:** `path.join(__dirname, 'models.json')` → `PATHS.MODELS_JSON_FILE`

- [ ] **Linha 383:** `path.join(__dirname, 'uploads')` → `PATHS.UPLOADS_DIR`

- [ ] **Linha 390:** `path.join(__dirname, 'uploads', file)` → `path.join(PATHS.UPLOADS_DIR, file)`

- [ ] **Linha 420:** `path.join(__dirname, 'uploads')` → `PATHS.UPLOADS_DIR`

- [ ] **Linha 427:** `path.join(__dirname, 'uploads', file)` → `path.join(PATHS.UPLOADS_DIR, file)`

- [ ] **Linha 509:** `path.join(__dirname, 'uploads', filename)` → `path.join(PATHS.UPLOADS_DIR, filename)`

- [ ] **Linha 678:** `path.join(__dirname, 'recipe.json')` → `PATHS.RECIPE_FILE`

- [ ] **Linha 744:** `path.join(__dirname, 'custom_preloading.json')` → `PATHS.CUSTOM_PRELOADING_FILE`

- [ ] **Linha 757:** `path.join(__dirname, 'models.json')` → `PATHS.MODELS_JSON_FILE`

### 2. Corrigir logger.js

**Arquivo:** `logger.js`

- [ ] **Linha 8:** Substituir `path.join(__dirname,'..','logs')` por:
```javascript
const { app } = require('electron');
const logDirectory = path.join(app.getPath('userData'), 'logs');
```

### 3. Remover electron-builder.json

- [ ] Deletar arquivo: `electron-builder.json`
- [ ] Toda configuração já está em `package.json`

### 4. Adicionar Validação de Runtimes

**Criar arquivo:** `scripts/validate-runtimes.ps1`

```powershell
$platforms = @('win', 'mac', 'linux')
$missingRuntimes = @()

foreach ($platform in $platforms) {
    $runtimePath = "runtimes/$platform/python"
    if (-Not (Test-Path $runtimePath)) {
        $missingRuntimes += $platform
    }
}

if ($missingRuntimes.Count -gt 0) {
    Write-Host "❌ ERRO: Runtimes Python não encontrados para: $($missingRuntimes -join ', ')" -ForegroundColor Red
    Write-Host "`nExecute primeiro:" -ForegroundColor Yellow
    Write-Host "  pwsh runtimes/download-runtimes.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Todos os runtimes Python encontrados" -ForegroundColor Green
exit 0
```

- [ ] Criar arquivo acima
- [ ] Adicionar ao `package.json`:
```json
"scripts": {
  "prebuild": "pwsh -ExecutionPolicy Bypass -File ./scripts/validate-runtimes.ps1",
  "build": "npm run prebuild && npm run dist"
}
```

---

## 🟠 PRIORIDADE 2 - TESTES

### Testes Locais

- [ ] Executar `npm run pack` (build sem instalador)
- [ ] Verificar estrutura do app.asar:
  ```bash
  npx asar list dist/win-unpacked/resources/app.asar | findstr "main.js models"
  ```
- [ ] Iniciar app empacotado: `dist/win-unpacked/AIpomoea.exe`
- [ ] Testar upload de imagem
- [ ] Verificar logs em: `%APPDATA%/AIpomoea/logs/`
- [ ] Testar execução de pipeline completo
- [ ] Verificar resultados em: `%APPDATA%/AIpomoea/results/`

### Validações

- [ ] `recipe.json` criado em `userData` (não em app.asar)
- [ ] Uploads salvos em `userData/uploads/`
- [ ] Logs aparecem em `userData/logs/`
- [ ] Nenhum erro de permissão (EACCES)

---

## 🟡 PRIORIDADE 3 - BUILD FINAL

### Preparação

- [ ] Todos os runtimes Python baixados:
  ```bash
  pwsh runtimes/download-runtimes.ps1
  pwsh runtimes/verify-runtimes.ps1
  ```

### Build Multi-Plataforma

- [ ] **Windows:**
  ```bash
  npm run dist:win
  ```
  - Verificar: `dist/AIpomoea-Setup-1.3.0.exe`
  - Verificar: `dist/AIpomoea-1.3.0-Portable.exe`

- [ ] **macOS** (se disponível):
  ```bash
  npm run dist:mac
  ```
  - Verificar: `dist/AIpomoea-1.3.0.dmg`

- [ ] **Linux** (se disponível):
  ```bash
  npm run dist:linux
  ```
  - Verificar: `dist/AIpomoea-1.3.0.AppImage`

### Teste de Instalação

- [ ] Instalar em máquina limpa (VM recomendada)
- [ ] Executar app pela primeira vez
- [ ] Verificar criação de venv em userData
- [ ] Testar workflow completo:
  1. Upload de imagens
  2. Seleção de modelos
  3. Execução de pipeline
  4. Export de resultados (CSV/JSON)
  5. Database export (se habilitado)

---

## 📋 CHECKLIST FINAL

### Código
- [ ] Todos os `__dirname` corrigidos
- [ ] `electron-builder.json` removido
- [ ] `logger.js` atualizado
- [ ] Validação de runtimes implementada

### Testes
- [ ] Build local executado com sucesso
- [ ] App empacotado testado
- [ ] Upload funciona
- [ ] Pipeline executa
- [ ] Resultados exportados

### Documentação
- [ ] BUILD_ANALYSIS_REPORT.md revisado
- [ ] CHANGELOG.md atualizado
- [ ] README.md com instruções de build

### Distribuição
- [ ] Tag de release criada no GitHub
- [ ] Instaladores gerados para todas as plataformas
- [ ] Checksums gerados (SHA256)
- [ ] Release notes preparadas

---

## 🚀 COMANDOS RÁPIDOS

```bash
# 1. Validar runtimes
pwsh runtimes/verify-runtimes.ps1

# 2. Build local (teste)
npm run pack

# 3. Testar app empacotado
.\dist\win-unpacked\AIpomoea.exe

# 4. Build final (após validações)
npm run dist:win

# 5. Verificar logs
Get-Content "$env:APPDATA\AIpomoea\logs\aipomoea.log" -Tail 50
```

---

## ⚠️ AVISOS IMPORTANTES

1. **NÃO distribuir** antes de completar PRIORIDADE 1
2. **SEMPRE testar** em máquina limpa (sem Python instalado)
3. **VERIFICAR** que runtimes Python estão incluídos no build
4. **TESTAR** em Windows 10 e Windows 11
5. **DOCUMENTAR** qualquer issue encontrado

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verificar logs em `%APPDATA%/AIpomoea/logs/`
2. Verificar estrutura do build em `dist/`
3. Consultar `BUILD_ANALYSIS_REPORT.md`
4. Abrir issue no GitHub com logs e passos para reproduzir

---

**Última Atualização:** 9 de novembro de 2025  
**Status:** ⚠️ CORREÇÕES PENDENTES
