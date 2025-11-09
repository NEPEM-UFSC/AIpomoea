# AIpomoea Testing Suite

## Estrutura de Testes em Camadas

```
tests/
├── conftest.py                 # Configuração global do pytest
├── test_smoke.py              # Camada 0: Testes de Fumaça
├── unit/                      # Camada 1: Testes de Unidade
│   ├── test_communication.py
│   ├── test_configuration.py
│   ├── test_preprocessing.py
│   ├── test_runner.py
│   └── test_file_exporter.py
├── integration/               # Camada 2: Testes de Integração
│   ├── test_orchestrator.py
│   └── test_main_pipeline.py
├── e2e/                       # Camada 3: Testes E2E
│   └── test_e2e_cli.py
└── mock_data/
    ├── images/                # Imagens de teste
    └── models/                # Modelos fake (.bat)
        ├── root_color.bat
        └── root_format.bat
```

## Configuração do Ambiente

### 1. Instalar Dependências de Teste

```bash
pip install -r src_python/requirements-test.txt
```

### 2. Preparar Mock Data

Coloque 2-3 imagens JPG de teste em `tests/mock_data/images/`:
- `root_1.jpg`
- `root_2.jpg`
- `leaves_1.jpg`

Os modelos fake já estão em `tests/mock_data/models/` como arquivos `.bat`.

## Executando os Testes

### Executar Todos os Testes
```bash
pytest
```

### Executar por Camada

**Camada 0 - Smoke Tests:**
```bash
pytest tests/test_smoke.py -v
```

**Camada 1 - Unit Tests:**
```bash
pytest tests/unit/ -v
```

**Camada 2 - Integration Tests:**
```bash
pytest tests/integration/ -v
```

**Camada 3 - E2E Tests:**
```bash
pytest tests/e2e/ -v
```

### Executar Testes Específicos

```bash
pytest tests/unit/test_communication.py::test_send_message_stdout -v
```

### Com Cobertura

```bash
pytest --cov=src_python --cov-report=html
```

## Tipos de Testes

### Camada 0: Smoke Tests (Sanity)
- **Objetivo**: Verificar se o ambiente está configurado
- **Testa**: Importação de módulos e pontos de entrada
- **Execução**: Rápida (~1s)

### Camada 1: Unit Tests
- **Objetivo**: Testar módulos em isolamento
- **Testa**: Funções individuais com dependências mockadas
- **Execução**: Rápida (~5s)
- **Módulos testados**:
  - `communication.py`: stdin/stdout JSON
  - `configuration.py`: AppConfig e RecipeProcessor
  - `preprocessing.py`: Filtros de imagem
  - `runner.py`: Execução de modelos
  - `file_exporter.py`: Exportação CSV/JSON

### Camada 2: Integration Tests
- **Objetivo**: Testar conexões entre módulos
- **Testa**: Fluxo de dados entre componentes
- **Execução**: Moderada (~10s)
- **Testa**:
  - `orchestrator.py`: Execução paralela/sequencial
  - `main.py`: Pipeline completo mockado

### Camada 3: E2E Tests
- **Objetivo**: Simular usuário real (Electron → Python)
- **Testa**: Contrato stdin/stdout completo
- **Execução**: Lenta (~30s)
- **Valida**: Processo completo via subprocess

## Estratégia de Teste

1. **Comece pela Camada 0**: Se falhar, corrija antes de prosseguir
2. **Foque na Camada 1**: A maioria do tempo deve ser aqui
3. **Use Camada 2**: Para validar refatorações
4. **Camada 3 é Final**: Prova que o contrato está intacto

## Mocks e Fixtures

### Fixtures do pytest Usadas
- `mocker`: Para mockar dependências (pytest-mock)
- `tmp_path`: Para criar diretórios temporários
- `capsys`: Para capturar stdout/stderr

### Estratégia de Mock
- **Unit Tests**: Mock tudo exceto o módulo testado
- **Integration Tests**: Mock apenas limites do sistema (.exe, stdin)
- **E2E Tests**: Sem mocks, processo real

## Verificando Cobertura

Após executar com `--cov`, abra `htmlcov/index.html` para ver:
- Linhas cobertas/não cobertas
- Branches testados
- Módulos com baixa cobertura

## Troubleshooting

### Erro: "Module not found"
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src_python"
```

### Erro: "pandas not found"
```bash
pip install -r src_python/requirements.txt
```

### Testes E2E Falhando
Verifique se o venv está ativado e se o Python está acessível.

## Próximos Passos

1. Adicionar testes E2E completos
2. Aumentar cobertura para 90%+
3. Adicionar testes de performance
4. CI/CD com GitHub Actions
