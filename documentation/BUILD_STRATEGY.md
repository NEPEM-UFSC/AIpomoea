# 🎯 Estratégia de Build Limpo

## 📋 Conceito

**Testes e documentação ficam no GitHub, mas NÃO vão para o instalador final.**

## 🔄 Fluxo de Arquivos

```
┌─────────────────┐
│   GitHub Repo   │ ← Tudo commitado aqui
│                 │   (código, testes, docs)
└────────┬────────┘
         │
         │ git clone
         ▼
┌─────────────────┐
│  Workspace Dev  │ ← Desenvolvedor trabalha aqui
│                 │   (testes executam normalmente)
└────────┬────────┘
         │
         │ npm run dist
         ▼
┌─────────────────┐
│  electron-builder│ ← Filtra arquivos aqui
│   (package.json) │   (usa "files" e "extraResources")
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  dist/ (Build)  │ ← SEM testes, SEM docs
│                 │   Apenas produção
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Instalador    │ ← Usuário final baixa
│  (.exe/.dmg)    │   Limpo e otimizado
└─────────────────┘
```

## ✅ O Que VAI para o GitHub

### Código de Produção
- ✅ `main.js`, `preload.js`, etc.
- ✅ `views/`, `static/`
- ✅ `src_python/` (código Python)

### Testes e Desenvolvimento
- ✅ `tests/` (todos os testes)
- ✅ `documentation/` (guias, specs)
- ✅ `tools/` (scripts de dev)
- ✅ `.github/workflows/` (CI/CD)
- ✅ `pytest.ini`, `.flake8`, etc.
- ✅ `*.md` (README, CONTRIBUTING, etc.)
- ✅ `todo.txt`

### Configurações
- ✅ `package.json`
- ✅ `.gitignore`
- ✅ `.gitattributes`

## ❌ O Que NÃO VAI para o GitHub

### Artefatos Gerados
- ❌ `dist/` (builds)
- ❌ `node_modules/` (dependências)
- ❌ `__pycache__/` (cache Python)
- ❌ `.pytest_cache/` (cache de testes)
- ❌ `tests/temp_results/` (resultados temporários)
- ❌ `.coverage`, `htmlcov/` (relatórios)

### Runtimes Baixados
- ❌ `runtimes/win/python/`
- ❌ `runtimes/mac/python/`
- ❌ `runtimes/linux/python/`

### Dados Locais
- ❌ `config.json`, `session.json`
- ❌ `*.log`, `*.pid`
- ❌ `results/`, `uploads/`

## 🎁 O Que VAI para o Instalador Final

### Apenas Produção
- ✅ `main.js`, `preload.js`
- ✅ `views/`, `static/`
- ✅ `models/` (ML)
- ✅ `package.json`
- ✅ `LICENSE.md`

### Recursos Extras (extraResources)
- ✅ `backend/src/` (Python filtrado, sem testes)
- ✅ `backend/runtime/` (Python standalone)

### **NÃO** Incluídos
- ❌ `tests/`
- ❌ `documentation/`
- ❌ `tools/`
- ❌ `.github/`
- ❌ `*.md` (exceto LICENSE)
- ❌ `pytest.ini`, `.flake8`
- ❌ `todo.txt`
- ❌ Qualquer arquivo `.test.py` ou `.test.js`

## 🔧 Como Funciona

### 1. `.gitignore` (Controla GitHub)

**Ignora apenas artefatos gerados:**

```gitignore
# Builds e caches (não commitam)
dist/
node_modules/
__pycache__/
.pytest_cache/
tests/temp_results/

# Runtimes baixados (não commitam)
runtimes/*/python/

# Dados locais (não commitam)
config.json
*.log
```

**NÃO ignora código fonte:**
- ✅ `tests/` (arquivos `.py`) VÃO pro GitHub
- ✅ `documentation/` VAI pro GitHub
- ✅ `tools/` VAI pro GitHub

### 2. `package.json` (Controla Build)

**Allow-list de produção:**

```json
"files": [
  "main.js",
  "views/**/*",
  "static/**/*",
  "!**/*.test.js",
  "!**/*.test.py",
  "!tests/",
  "!documentation/",
  "!tools/"
]
```

**Recursos com filtros:**

```json
"extraResources": [
  {
    "from": "./src_python",
    "to": "backend/src",
    "filter": [
      "**/*",
      "!**/*.test.py",
      "!**/tests/"
    ]
  }
]
```

## 🧪 Casos de Uso

### Desenvolvedor Local

```bash
# 1. Clone do repo (tudo vem)
git clone https://github.com/NEPEM-UFSC/AIpomoea.git
cd AIpomoea

# 2. Instala dependências
npm install

# 3. Baixa runtime Python
cd runtimes
.\download-runtimes.ps1

# 4. Testes funcionam normalmente
cd ..
pytest tests/
npm test

# 5. App funciona normalmente
npm start

# 6. Build (SEM testes)
npm run dist:win
```

**Resultado:**
- ✅ Workspace tem tudo (código + testes + docs)
- ✅ Build em `dist/` tem só produção
- ✅ Instalador final: ~199 MB (limpo)

### GitHub Actions (CI/CD)

```yaml
# 1. Checkout (tudo vem do repo)
- uses: actions/checkout@v4

# 2. Testes executam normalmente
- run: pytest tests/

# 3. Build (electron-builder filtra)
- run: npm run dist:win

# 4. Release (só executável)
- uses: softprops/action-gh-release@v1
  with:
    files: dist/*.exe  # SEM testes!
```

**Resultado:**
- ✅ CI pode executar testes
- ✅ Build final é limpo
- ✅ Release não tem testes

### Usuário Final

```
# 1. Baixa do GitHub Releases
AIpomoea-Setup-1.3.0.exe (199 MB)

# 2. Instala

# 3. O que ele recebe:
C:\Program Files\AIpomoea\
  ├── AIpomoea.exe
  ├── resources/
  │   ├── app.asar (código compactado)
  │   ├── backend/
  │   │   ├── src/ (Python SEM testes)
  │   │   └── runtime/ (Python standalone)
  │   └── static/
  └── (sem pasta tests/, sem docs/)
```

**Resultado:**
- ✅ App funciona perfeitamente
- ✅ Sem arquivos desnecessários
- ✅ Tamanho otimizado

## 📊 Comparação

| Local | Testes | Docs | Tamanho |
|-------|--------|------|---------|
| **GitHub Repo** | ✅ Sim | ✅ Sim | ~50 MB |
| **Workspace Dev** | ✅ Sim | ✅ Sim | ~400 MB (com node_modules) |
| **dist/ (Build)** | ❌ Não | ❌ Não | ~266 MB |
| **Instalador** | ❌ Não | ❌ Não | ~199 MB |
| **Instalado no PC** | ❌ Não | ❌ Não | ~266 MB |

## ✅ Verificação

### Confirmar que testes ESTÃO no GitHub

```bash
git ls-files | grep test
```

**Deve mostrar:**
```
tests/unit/test_communication.py
tests/integration/test_main_pipeline.py
pytest.ini
src_python/requirements-test.txt
...
```

### Confirmar que testes NÃO ESTÃO no build

```bash
npm run verify-build
```

**Deve mostrar:**
```
🚫 Arquivos/Pastas EXCLUÍDOS do build:
  ✓ tests/
  ✓ documentation/
  ✓ **/*.test.py
```

### Confirmar no instalador final

```powershell
# Após npm run dist:win
cd dist/win-unpacked/resources
Get-ChildItem -Recurse | Select-String "test"
# Deve retornar vazio ou apenas nomes não relacionados
```

## 🎯 Resumo

✅ **GitHub:** Tudo commitado (código + testes + docs)  
✅ **Workspace:** Tudo presente (desenvolvimento completo)  
✅ **Build:** Apenas produção (electron-builder filtra)  
✅ **Instalador:** Limpo e otimizado (usuário final)  

**Separação perfeita entre desenvolvimento e distribuição!**

---

**Data:** 9 de novembro de 2025  
**Status:** ✅ Implementado e testado
