# Débito de Funcionalidades (Feats a Implementar)

Este documento lista as funcionalidades de UI que atualmente utilizam placeholders e precisam de integração com o backend (Python/Electron) para funcionarem de forma dinâmica.

## Tela Inicial (Home) - Painel de Status

A seção de "Visão Geral / Status" na Home utiliza os seguintes placeholders que devem ser conectados ao banco de dados local ou ao estado do sistema:

### 1. Projetos Ativos
- **Placeholder Atual:** `3`
- **Descrição:** Deve mostrar a contagem de diretórios de projeto configurados ou acessados recentemente pelo usuário.
- **Sugestão de Implementação:** Consultar a lista de projetos recentes no `localStorage` ou em um arquivo de configuração `config.json`.

### 2. Total de Amostras Processadas
- **Placeholder Atual:** `1.250`
- **Descrição:** Tally acumulado de todas as amostras analisadas (Folhas + Raízes) em todos os projetos locais.
- **Sugestão de Implementação:** Criar um contador persistente no banco de dados local (SQLite/Nedb) que é incrementado a cada pipeline finalizado com sucesso.

### 3. Última Análise Realizada
- **Placeholder Atual:** `10 minutos atrás`
- **Descrição:** Timestamp relativo da última execução de qualquer um dos módulos de fenotipagem.
- **Sugestão de Implementação:** Armazenar a data da última análise bem-sucedida e calcular a diferença de tempo no front-end.

### 4. Status do Dispositivo de Captura
- **Placeholder Atual:** `Conectado`
- **Descrição:** Indica se o hardware de captura (câmera/sensor) está acessível pelo sistema.
- **Sugestão de Implementação:** Criar um evento de "Heartbeat" entre o processo principal do Electron e o hardware para atualizar o estado na UI.

---
*Documento gerado para orientação do time de Backend.*
