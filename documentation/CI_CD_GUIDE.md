# 🔄 CI/CD Workflow Guide

## 📋 **Overview**

Este projeto implementa um sistema completo de **Continuous Integration/Continuous Delivery** usando GitHub Actions. O sistema possui dois workflows principais:

1. **CI Workflow** (`.github/workflows/ci.yml`) - Testes e qualidade de código
2. **Release Workflow** (`.github/workflows/release.yml`) - Build e publicação

---

## 🧪 **CI Workflow - Tests and Quality Checks**

### **Quando é executado:**
- ✅ Push para branches `main` ou `dev/remaster`
- ✅ Pull requests para `main` ou `dev/remaster`
- ✅ Manualmente via workflow_dispatch

### **Jobs executados:**

#### 1️⃣ **test-python** (Multi-OS)
Executa testes Python em Windows, macOS e Linux:
```bash
pytest tests/test_smoke.py       # Testes de fumaça
pytest tests/unit/               # Testes unitários
pytest tests/integration/        # Testes de integração
pytest tests/ --cov=src_python   # Coverage (apenas Ubuntu)
```

**Resultado:** Coverage report enviado ao Codecov (requer token)

#### 2️⃣ **lint-python**

Verifica qualidade do código Python:

```bash
flake8 src/ main.py   # Linting
black --check         # Code formatting
isort --check-only    # Import sorting
```

**Falha se:** Houver erros de linting, formatação incorreta ou imports fora de ordem

#### 3️⃣ **test-electron** (Multi-OS)
Testes do ambiente Node.js/Electron:
```bash
npm ci                           # Install dependencies
npm audit --audit-level=high     # Security check
npm run verify-build             # Build integrity
```

#### 4️⃣ **security-scan**
Escaneia vulnerabilidades com Trivy:
- 🔍 Analisa todo o filesystem
- 🚨 Detecta vulnerabilidades CRITICAL/HIGH/MEDIUM
- 📊 Upload de resultados para GitHub Security tab

#### 5️⃣ **build-test** (Multi-OS)
Testa o processo de build completo:
- ⬇️ Download do Python runtime
- 📦 Executa `npm run pack`
- 📤 Upload de artifacts para inspeção (3 dias)

#### 6️⃣ **quality-gate**
Resume o status de todos os jobs anteriores e falha se algum não passou.

---

## 🚀 **Release Workflow - Build and Publish**

### **Quando é executado:**
- ✅ Push de tags no formato `v*.*.*` (ex: `v1.3.0`)
- ✅ Manualmente via workflow_dispatch

### **Processo:**
1. Checkout do código
2. Download dos runtimes Python (win/mac/linux)
3. Build de instaladores:
   - **Windows:** `.exe` (NSIS), `.zip`
   - **macOS:** `.dmg`, `.zip`
   - **Linux:** `.AppImage`, `.deb`, `.tar.gz`
4. Criação de GitHub Release automática
5. Upload de todos os instaladores

---

## 🔧 **Configuração Local**

### **Instalar dependências de teste:**
```bash
cd src_python
pip install -r requirements-test.txt
```

Isso instala:
- `pytest` - Framework de testes
- `pytest-cov` - Code coverage
- `pytest-mock` - Mocking
- `flake8` - Linting
- `black` - Code formatting
- `isort` - Import sorting

### **Scripts NPM disponíveis:**

| Script | Descrição |
|--------|-----------|
| `npm test` | Executa todos os testes (via PowerShell) |
| `npm run test:python` | Testes Python (todos) |
| `npm run test:smoke` | Smoke tests |
| `npm run test:unit` | Unit tests |
| `npm run test:integration` | Integration tests |
| `npm run test:coverage` | Testes com coverage report HTML |
| `npm run lint` | Linting Python |
| `npm run format` | Formata código Python (black + isort) |
| `npm run format:check` | Verifica formatação sem modificar |

---

## 📊 **Code Coverage com Codecov**

### **Setup inicial:**

1. Criar conta em [codecov.io](https://codecov.io)
2. Adicionar repositório AIpomoea
3. Copiar o token gerado
4. Adicionar secret no GitHub:
   - Ir em: `Settings` → `Secrets and variables` → `Actions`
   - Criar: `CODECOV_TOKEN` com o valor do token

### **Visualizar coverage:**
Após o CI rodar, acesse:
```
https://codecov.io/gh/NEPEM-UFSC/AIpomoea
```

---

## 🛡️ **Security Scanning com Trivy**

### **O que é verificado:**
- ✅ Vulnerabilidades em dependências Python (requirements.txt)
- ✅ Vulnerabilidades em dependências Node.js (package.json)
- ✅ Configurações inseguras
- ✅ Secrets expostos

### **Resultados:**
- 📊 Summary table no log do workflow
- 🔒 SARIF upload para GitHub Security tab
- 🚨 Alertas automáticos se vulnerabilidades CRITICAL forem encontradas

### **Visualizar:**
```
Repository → Security → Code scanning alerts
```

---

## 🔄 **Workflow de Desenvolvimento**

### **1. Desenvolvimento local:**
```bash
# Criar branch
git checkout -b feature/minha-feature

# Fazer alterações...

# Verificar qualidade ANTES de commitar
npm run lint              # Verifica erros de linting
npm run format:check      # Verifica formatação
npm run test:smoke        # Testes rápidos
```

### **2. Corrigir problemas de formatação:**

```bash
# Autoformat código Python
npm run format

# Verificar se ficou OK
npm run format:check
```

### **3. Commit e push:**
```bash
git add .
git commit -m "feat: minha nova feature"
git push origin feature/minha-feature
```

### **4. Abrir Pull Request:**
- O CI será executado automaticamente
- Aguardar todos os checks passarem ✅
- Se falhar: corrigir e push novamente

### **5. Merge para dev/remaster:**
- CI será executado novamente no branch principal

### **6. Criar release:**
```bash
# Atualizar version no package.json
git tag v1.4.0
git push origin v1.4.0
```
- Release workflow cria instaladores automaticamente
- GitHub Release é publicada com todos os arquivos

---

## 🐛 **Troubleshooting**

### **Erro: "CODECOV_TOKEN not found"**
Adicionar secret no GitHub (veja seção Code Coverage)

### **Erro: Trivy scan failed**
Verificar permissões do workflow:
```yaml
permissions:
  security-events: write
  contents: read
```

### **Erro: Build failed - Python runtime missing**
Verificar se os scripts de download funcionam:
```bash
# Windows
./runtimes/download-runtimes.ps1

# Unix (macOS/Linux)
./runtimes/download-runtimes.sh
```

### **Erro: Black formatting failed**

Executar localmente:

```bash
cd src_python
black src/ main.py
```

### **Erro: Import sorting (isort) failed**

Executar localmente:

```bash
cd src_python
isort src/ main.py
```

---

## 📈 **Badges para README**

Adicionar ao README.md:
```markdown
[![CI Status](https://github.com/NEPEM-UFSC/AIpomoea/workflows/CI%20-%20Tests%20and%20Quality%20Checks/badge.svg)](https://github.com/NEPEM-UFSC/AIpomoea/actions)
[![codecov](https://codecov.io/gh/NEPEM-UFSC/AIpomoea/branch/main/graph/badge.svg)](https://codecov.io/gh/NEPEM-UFSC/AIpomoea)
[![Release](https://img.shields.io/github/v/release/NEPEM-UFSC/AIpomoea)](https://github.com/NEPEM-UFSC/AIpomoea/releases)
```

---

## 🎯 **Próximos Passos**

- [ ] Configurar Codecov token
- [ ] Verificar permissões do Trivy no GitHub
- [ ] Adicionar badges ao README
- [ ] Documentar resultados de security scans
- [ ] Integrar Dependabot para updates automáticos

---

**Autor:** NEPEM-UFSC  
**Última atualização:** 2025-05-15
