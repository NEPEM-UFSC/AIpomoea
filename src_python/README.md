# AIpomoea Python Backend - Arquitetura Modular

## Estrutura do Projeto

```
src_python/
├── main.py                      # Orquestrador principal
├── requirements.txt             # Dependências Python
└── src/
    ├── __init__.py
    ├── communication.py         # Comunicação stdin/stdout
    ├── configuration.py         # Gerenciamento de configurações
    ├── preprocessing.py         # Pré-processamento de imagens
    ├── utils.py                 # Utilitários gerais
    ├── execution/
    │   ├── __init__.py
    │   ├── runner.py            # Execução de modelos individuais
    │   └── orchestrator.py      # Orquestração paralela/sequencial
    └── exporting/
        ├── __init__.py
        ├── file_exporter.py     # Exportação para CSV/JSON
        └── database.py          # Exportação para SQLite
```

## Módulos

### `communication.py`
Responsável pela comunicação com o processo Electron:
- `read_command()`: Lê JSON do stdin
- `send_message(type, payload)`: Envia mensagens JSON pelo stdout
- `send_log(level, message)`: Envia logs
- `send_error(code, message, task, trace)`: Envia erros estruturados

### `configuration.py`
Gerencia todas as configurações:
- `AppConfig`: Classe que valida e armazena toda a configuração
- `RecipeProcessor`: Processa comandos em categorias (execução, exportação, specs)

### `preprocessing.py`
Pré-processamento de imagens:
- `prepare_image_list(config)`: Filtra imagens baseado em regras customizadas
- Suporta `selectOnly` e `excludeOnly`

### `utils.py`
Utilitários gerais:
- `Utils`: Classe com métodos de benchmark e navegação de diretórios

### `execution/runner.py`
Execução de modelos individuais:
- `execute_single_command()`: Executa um modelo em um conjunto de imagens
- Gerencia batches e retry em caso de falha

### `execution/orchestrator.py`
Orquestração da pipeline:
- `run_pipeline(config)`: Função principal de execução
- Suporta execução paralela (multiprocessing) e sequencial
- Fallback automático para sequencial em caso de falha

### `exporting/file_exporter.py`
Exportação para arquivos:
- `FileExporter`: Classe para exportar resultados
- Suporta CSV e JSON
- Agrupa resultados por posição quando configurado

### `exporting/database.py`
Exportação para banco de dados:
- `export_to_db()`: Exporta para SQLite
- Suporta INSERT e UPDATE

## Fluxo de Execução

1. **main.py** lê comando do stdin via `communication.read_command()`
2. Cria `AppConfig` para validar e processar configurações
3. `preprocessing.prepare_image_list()` filtra imagens
4. `orchestrator.run_pipeline()` executa todos os modelos
5. Resultados são agregados em DataFrame
6. Exportação via `database.export_to_db()` e/ou `FileExporter`
7. Envia mensagem de conclusão via `communication.send_message()`

## Comunicação com Electron

### Entrada (stdin)
```json
{
  "typemode": "root",
  "commands": {"root_color": true, "root_format": true},
  "config": {...},
  "files_to_process": ["image1.jpg", "image2.jpg"],
  "paths": {
    "models_dir": "/path/to/models",
    "uploads_dir": "/path/to/uploads",
    "results_dir": "/path/to/results"
  }
}
```

### Saída (stdout - JSON por linha)
```json
{"type": "log", "payload": {"level": "info", "message": "..."}}
{"type": "progress", "payload": {"task": "root_color", "status": "running", "processed": 10}}
{"type": "error", "payload": {"code": "...", "message": "...", "trace": "..."}}
{"type": "complete", "payload": {"status": "success", "results_count": 42}}
```

## Vantagens da Nova Arquitetura

✅ **Responsabilidade única**: Cada módulo tem uma função clara
✅ **Testabilidade**: Módulos isolados são fáceis de testar
✅ **Manutenibilidade**: Mudanças localizadas não afetam o sistema todo
✅ **Escalabilidade**: Fácil adicionar novos exportadores ou executores
✅ **Clareza**: `main.py` é simples e legível
✅ **Compatibilidade**: Interface stdin/stdout mantida com Electron
