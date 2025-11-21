# 🧪 Testes JavaScript - Guia Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Configuração](#configuração)
4. [Execução dos Testes](#execução-dos-testes)
5. [Arquivos Testados](#arquivos-testados)
6. [Estatísticas](#estatísticas)
7. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

Suite completa de testes JavaScript para os módulos estáticos do AIpomoea, cobrindo comunicação IPC, manipulação de DOM, chamadas de API e tratamento de erros.

### Resultados Atuais

```
✅ 57/57 testes passando (100%)
✅ 7/7 suites de teste passando
⏱️ Tempo médio: 11-13 segundos
```

---

## 📁 Estrutura de Arquivos

```
AIpomoea/
├── jest.config.js                    # Configuração do Jest
├── tests/
│   └── js/
│       ├── setup.js                  # Mocks globais e configuração
│       ├── README.md                 # Documentação detalhada
│       ├── check-models.test.js      # 8 testes
│       ├── commands-check.test.js    # 6 testes
│       ├── config-handler.test.js    # 12 testes
│       ├── image-handler.test.js     # 13 testes
│       ├── log-handler.test.js       # 4 testes
│       ├── send-commands.test.js     # 5 testes
│       └── version.test.js           # 9 testes
└── static/
    └── js/
        ├── check-models.js           # Verificação de modelos ML
        ├── commands-check.js         # Bloqueio de operações
        ├── config-handler.js         # Gerenciamento de config
        ├── image-handler.js          # Manipulação de imagens
        ├── log-handler.js            # Sistema de logs
        ├── send-commands.js          # Envio de comandos
        └── version.js                # Verificação de versão
```

---

## ⚙️ Configuração

### Dependências Instaladas

```json
{
  "devDependencies": {
    "jest": "^29.x.x",
    "@types/jest": "^29.x.x",
    "jest-environment-jsdom": "^29.x.x"
  }
}
```

### Scripts NPM

```json
{
  "scripts": {
    "test:js": "jest tests/js/",
    "test:js:watch": "jest tests/js/ --watch",
    "test:js:coverage": "jest tests/js/ --coverage"
  }
}
```

### jest.config.js

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/js/**/*.test.js'],
  collectCoverageFrom: [
    'static/js/**/*.js',
    '!static/js/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage/js',
  coverageReporters: ['text', 'html', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/tests/js/setup.js'],
  transform: {},
  moduleFileExtensions: ['js'],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### Mocks Globais (setup.js)

```javascript
// Mock Electron IPC Renderer
global.ipcRenderer = {
  send: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn()
};

// Mock Electron webUtils
global.webUtils = {
  getPathForFile: jest.fn()
};

// Mock window.electron
global.window.electron = {
  ipcRenderer: global.ipcRenderer
};

// Mock fetch API
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
```

---

## 🚀 Execução dos Testes

### Executar Todos os Testes

```bash
npm run test:js
```

**Saída Esperada:**
```
Test Suites: 7 passed, 7 total
Tests:       57 passed, 57 total
Snapshots:   0 total
Time:        11.241 s
```

### Modo Watch (Desenvolvimento)

```bash
npm run test:js:watch
```

Executa os testes automaticamente ao salvar arquivos.

### Relatório de Cobertura

```bash
npm run test:js:coverage
```

Gera relatório HTML em `coverage/js/index.html`.

---

## 📊 Arquivos Testados

### 1. version.js (9 testes)

**Funcionalidades:**
- Verificação de versão via API NEPEMVERSER
- Exibição de badges (atualizado/desatualizado/erro)
- Comunicação IPC

**Principais Cenários:**
- ✓ Fetch bem-sucedido da versão mais recente
- ✓ Erro de conexão (INTERNET_DISCONNECTED)
- ✓ Comparação de versões (atualizado vs desatualizado)
- ✓ Atualização de elementos DOM

### 2. config-handler.js (12 testes)

**Funcionalidades:**
- Leitura e escrita de configurações
- Gerenciamento de popups
- Seleção de arquivo de banco de dados

**Principais Cenários:**
- ✓ Atualização de inputs (text, checkbox, select)
- ✓ Salvamento de configurações via IPC
- ✓ Exibição/ocultação de popups
- ✓ Dialog de seleção de arquivos

### 3. image-handler.js (13 testes)

**Funcionalidades:**
- Upload e exibição de imagens
- Navegação entre imagens
- Validação de tipos de arquivo

**Principais Cenários:**
- ✓ FileReader para ler arquivos
- ✓ Validação de extensões (jpg, jpeg, png, gif)
- ✓ Navegação circular (prevImage/nextImage)
- ✓ Upload via IPC com webUtils

### 4. log-handler.js (4 testes)

**Funcionalidades:**
- Envio de mensagens de log via IPC

**Principais Cenários:**
- ✓ Logs de diferentes níveis (info, warn, error)
- ✓ Fallback quando IPC indisponível

### 5. send-commands.js (5 testes)

**Funcionalidades:**
- Coleta de estados de checkboxes
- Envio de comandos para processamento

**Principais Cenários:**
- ✓ Coleta de múltiplos checkboxes
- ✓ Diferentes modos de operação
- ✓ Exibição de loading popup
- ✓ Tratamento de erros IPC

### 6. check-models.js (8 testes)

**Funcionalidades:**
- Verificação de informações de modelos ML
- Validação de executáveis de modelos

**Principais Cenários:**
- ✓ Populamento de tabela com detalhes de modelos
- ✓ Tratamento de modelos root e leaves
- ✓ Exibição de popups de sucesso/erro
- ✓ Lista de modelos inválidos

### 7. commands-check.js (6 testes)

**Funcionalidades:**
- Bloqueio de operações baseado em modelos disponíveis
- Conversão de IDs (hífens → underscores)

**Principais Cenários:**
- ✓ Fetch de models.json
- ✓ Desabilitação de operações indisponíveis
- ✓ Proteção de operações de export
- ✓ Tratamento de erros de fetch

---

## 📈 Estatísticas

### Distribuição de Testes

| Arquivo | Testes | % do Total |
|---------|--------|------------|
| image-handler.js | 13 | 22.8% |
| config-handler.js | 12 | 21.1% |
| version.js | 9 | 15.8% |
| check-models.js | 8 | 14.0% |
| commands-check.js | 6 | 10.5% |
| send-commands.js | 5 | 8.8% |
| log-handler.js | 4 | 7.0% |
| **TOTAL** | **57** | **100%** |

### Cobertura por Tipo

| Tipo | Testes | % do Total |
|------|--------|------------|
| 🎨 Manipulação de DOM | 20 | 35.1% |
| 🔗 Comunicação IPC | 15 | 26.3% |
| 🌐 Fetch/API calls | 12 | 21.1% |
| ⚠️ Tratamento de Erros | 10 | 17.5% |

### Taxa de Sucesso

```
┌─────────────────────────────────────┐
│  Testes Passando: 57/57 (100%)  ✅  │
│  Suites Passando: 7/7 (100%)    ✅  │
│  Taxa de Falha: 0%              ✅  │
└─────────────────────────────────────┘
```

---

## 🔮 Próximos Passos

### Prioridade Alta
- [ ] **Testes de Electron Main Process**
  - Testar `main.js` (janela, menu, IPC handlers)
  - Testar `preload.js` (exposição segura de APIs)
  - Testar `PythonEnvManager.js` (gerenciamento de Python)

### Prioridade Média
- [ ] **Testes E2E (End-to-End)**
  - Configurar Spectron ou Playwright
  - Testar fluxos completos de usuário
  - Testar janelas e diálogos

- [ ] **Integração no CI/CD**
  - Adicionar ao `.github/workflows/ci.yml`
  - Executar em multi-OS (Win/Mac/Linux)
  - Gerar relatórios de cobertura combinados

### Prioridade Baixa
- [ ] **Cobertura de Código Real**
  - Configurar c8 ou nyc
  - Meta: 80%+ de cobertura de linha
  - Instrumentação de código

- [ ] **Testes de Performance**
  - Benchmarking de funções críticas
  - Testes de memória e vazamentos
  - Otimização de renderização

---

## 🛠️ Manutenção

### Adicionando Novos Testes

1. Criar arquivo `tests/js/novo-modulo.test.js`
2. Importar mocks do `setup.js`
3. Seguir padrão de nomenclatura: `describe('modulo.js - Descrição')`
4. Executar `npm run test:js:watch` durante desenvolvimento

### Debugando Testes

```bash
# Executar teste específico
npm run test:js -- tests/js/version.test.js

# Executar com verbose
npm run test:js -- --verbose

# Executar sem cache
npm run test:js -- --no-cache
```

### Atualizando Mocks

Editar `tests/js/setup.js` para adicionar novos mocks globais.

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [Spectron](https://www.electronjs.org/spectron)

---

## ✅ Checklist de Qualidade

- [x] 100% dos testes passando
- [x] Cobertura de todos os módulos JS estáticos
- [x] Mocks adequados para ambiente Electron
- [x] Documentação completa e atualizada
- [x] Scripts NPM configurados
- [x] Setup automatizado (beforeEach/afterEach)
- [ ] Testes E2E implementados
- [ ] Integração com CI/CD
- [ ] Cobertura de código > 80%

---

**Última Atualização:** 9 de novembro de 2025
**Versão:** 1.0.0
**Autor:** GitHub Copilot + NEPEM-UFSC
