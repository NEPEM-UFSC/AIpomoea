# Quick Start - Testing Guide

## 1. Setup (One-time)

```powershell
# Instalar dependências de teste no venv
.\tests\setup-tests.ps1
```

## 2. Run Tests

```powershell
# Smoke tests (mais rápido)
.\tests\run-tests.ps1 smoke

# Unit tests
.\tests\run-tests.ps1 unit

# Integration tests
.\tests\run-tests.ps1 integration

# Todos os testes
.\tests\run-tests.ps1 all

# Com relatório de cobertura
.\tests\run-tests.ps1 coverage
```

## 3. Interpretando Resultados

### ✅ Sucesso
```
tests/test_smoke.py::test_all_modules_import PASSED
tests/unit/test_communication.py::test_send_message_stdout PASSED
```

### ❌ Falha
```
tests/unit/test_runner.py::test_execute_single_command FAILED
```

Veja o traceback para detalhes do erro.

## 4. Debug de Testes

```powershell
# Executar teste específico com verbose
pytest tests/unit/test_communication.py::test_send_message_stdout -vv

# Com print statements
pytest tests/unit/test_communication.py -s

# Com pdb debugger
pytest tests/unit/test_communication.py --pdb
```

## 5. Checklist Antes de Commit

- [ ] `.\tests\run-tests.ps1 smoke` passa
- [ ] `.\tests\run-tests.ps1 unit` passa
- [ ] `.\tests\run-tests.ps1 integration` passa
- [ ] Cobertura > 80%

## 6. Troubleshooting

**Erro: Module not found**
```powershell
$env:PYTHONPATH = "$PWD\src_python"
pytest
```

**Erro: pytest não encontrado**
```powershell
pip install -r src_python\requirements-test.txt
```

**Testes lentos**
```powershell
# Rodar em paralelo
pytest -n auto
```
