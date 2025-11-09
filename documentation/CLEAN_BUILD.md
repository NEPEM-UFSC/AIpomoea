# 🧹 Build Limpo - Documentação

## ✅ Implementação Concluída

O AIpomoea agora utiliza uma estratégia **Allow-List (Lista de Permissão)** para garantir que apenas arquivos de produção sejam incluídos nos executáveis finais.

## 🎯 Objetivo

- ✅ Reduzir o tamanho do instalador
- ✅ Excluir todos os arquivos de teste
- ✅ Remover documentação interna
- ✅ Proteger código de teste de ser exposto

## 📋 O Que Foi Implementado

### 1. Configuração do `package.json`

#### Allow-List de Arquivos (Abordagem Segura)

```json
"files": [
  "main.js",
  "preload.js",
  "PythonEnvManager.js",
  "logger.js",
  "package.json",
  "LICENSE.md",
  "views/**/*",
  "static/**/*",
  "models/**/*",
  // Exclusões explícitas
  "!**/*.test.js",
  "!**/*.spec.js",
  "!**/*.test.py",
  "!**/tests/",
  "!documentation/",
  "!tools/",
  // ... e mais
]
```

#### Recursos Extras com Filtros

```json
"extraResources": [
  {
    "from": "./src_python",
    "to": "backend/src",
    "filter": [
      "**/*",
      "!**/*.test.py",
      "!**/tests/",
      "!requirements-test.txt"
    ]
  },
  {
    "from": "./runtimes/${platform}/python",
    "to": "backend/runtime"
  }
]
```

### 2. Atualização do `.gitignore`

Adicionadas entradas para prevenir commit de artefatos de teste:

```gitignore
.pytest_cache/
.coverage
htmlcov/
*.test.log
.jest-cache/
test-results/
```

### 3. Script de Verificação

Criado `scripts/verify-build-contents.ps1` para:
- ✅ Mostrar o que será incluído
- ✅ Listar o que será excluído
- ✅ Calcular tamanho estimado do build

**Uso:**
```bash
npm run verify-build
```

## 📊 Resultado

### Incluído no Build Final

#### Arquivos Principais
- `main.js` - Processo principal do Electron
- `preload.js` - Script de preload
- `PythonEnvManager.js` - Gerenciador do Python
- `logger.js` - Sistema de logs
- `package.json` - Metadados
- `LICENSE.md` - Licença

#### Diretórios de Produção
- `views/` - Interface HTML (9 arquivos)
- `static/` - CSS, JS, imagens (48 arquivos)
- `models/` - Modelos de ML (118 MB)

#### Recursos Extras
- `backend/src/` - Código Python (15 arquivos, ~90 KB)
- `backend/runtime/` - Python 3.11.14 standalone (147 MB)

### Excluído do Build Final

- ❌ `tests/` - Toda a pasta de testes
- ❌ `documentation/` - Documentação interna
- ❌ `tools/` - Scripts de desenvolvimento
- ❌ `pytest.ini`, `.flake8` - Configs de teste
- ❌ `.github/` - GitHub Actions
- ❌ `*.md` - Arquivos Markdown (exceto LICENSE.md)
- ❌ `todo.txt` - Lista de tarefas
- ❌ `**/*.test.py` - Testes Python
- ❌ `**/*.test.js` - Testes JavaScript
- ❌ `**/__pycache__/` - Cache Python
- ❌ `requirements-test.txt` - Dependências de teste

## 📏 Tamanhos Estimados

| Métrica | Tamanho |
|---------|---------|
| **Arquivos brutos** | ~266 MB |
| **Após ASAR + compressão** | ~226 MB |
| **Instalador final (NSIS/DMG)** | ~199 MB |

## 🧪 Como Verificar

### Antes de Fazer o Build

```bash
npm run verify-build
```

Isso mostra:
- ✅ O que será incluído
- ❌ O que será excluído
- 📊 Tamanho estimado

### Após o Build

Inspecione o conteúdo:

**Windows:**
```powershell
# Descompactar o instalável
cd dist/win-unpacked
Get-ChildItem -Recurse
```

**Verificar se não há pasta de testes:**
```powershell
Get-ChildItem -Recurse -Filter "*test*"
# Deve retornar vazio ou apenas arquivos necessários
```

## 🔄 Workflow de Desenvolvimento

### Durante o Desenvolvimento

```bash
# Testes disponíveis normalmente
pytest tests/
npm test

# Rodar o app localmente
npm start
```

### Antes do Release

```bash
# 1. Verificar o que será incluído
npm run verify-build

# 2. Limpar builds anteriores
npm run clean

# 3. Gerar o build
npm run dist:win  # ou dist:mac, dist:linux
```

### No CI/CD (GitHub Actions)

O workflow `.github/workflows/release.yml` já está configurado para:
1. Executar testes
2. Gerar build limpo automaticamente
3. Publicar apenas os executáveis

## ✨ Benefícios

### 🎯 Segurança
- Código de teste não é exposto aos usuários
- Credenciais de teste não são incluídas
- Lógica de teste permanece privada

### 📦 Eficiência
- Instalador ~30-40% menor
- Download mais rápido para usuários
- Menos espaço em disco após instalação

### 🧹 Limpeza
- Apenas código de produção
- Sem arquivos desnecessários
- Build profissional

## 🛠️ Customização

### Adicionar Arquivo à Allow-List

Edite `package.json`:

```json
"files": [
  "main.js",
  "meu-novo-arquivo.js",  // Adicione aqui
  // ...
]
```

### Excluir Novo Tipo de Arquivo

```json
"files": [
  // ...
  "!**/*.meu-formato",  // Adicione com !
]
```

### Filtrar Recursos Extras

```json
"extraResources": [
  {
    "from": "./src_python",
    "to": "backend/src",
    "filter": [
      "**/*",
      "!**/meu-padrão-excluir/**"
    ]
  }
]
```

## 📝 Checklist de Verificação

Antes de criar um release:

- [ ] Execute `npm run verify-build`
- [ ] Confirme que `tests/` está na lista de excluídos
- [ ] Verifique o tamanho estimado (deve ser <250 MB)
- [ ] Teste o build localmente: `npm run dist:win`
- [ ] Inspecione `dist/win-unpacked` para confirmar
- [ ] Não deve haver pasta `tests/` no build
- [ ] Não deve haver arquivos `.test.py` ou `.test.js`

## 🐛 Solução de Problemas

### "Build muito grande"

Execute `npm run verify-build` e verifique:
- Se `models/` está incluindo arquivos desnecessários
- Se há arquivos grandes acidentalmente incluídos

### "Arquivo necessário não está no build"

Adicione-o explicitamente à allow-list em `package.json`:
```json
"files": ["arquivo-necessario.ext"]
```

### "Testes ainda aparecem no build"

Verifique se você está usando:
```json
"!**/tests/"  // Com ** para recursivo
```

Não apenas:
```json
"!tests/"  // Apenas raiz
```

## 🎓 Referências

- [Electron Builder - File Patterns](https://www.electron.build/configuration/contents#files)
- [Glob Patterns](https://github.com/isaacs/node-glob#glob-primer)
- [ASAR Archive](https://github.com/electron/asar)

## ✅ Status

🎉 **Sistema de Build Limpo totalmente implementado e funcional!**

Todos os arquivos de teste, documentação e desenvolvimento são automaticamente excluídos dos builds de produção.
