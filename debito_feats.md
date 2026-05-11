# Débito de Funcionalidades (Feats a Implementar)

Este documento lista as funcionalidades de UI que atualmente utilizam placeholders e precisam de integração com o backend (Python/Electron) para funcionarem de forma dinâmica.

## Tela Inicial (Home) - Ensaios Recentes

A seção de "Ensaios Recentes" substitui as métricas genéricas por um histórico de workspaces locais, focando na produtividade do pesquisador.

### 1. Lista de Diretórios Recentes
- **Placeholders Atuais:** 3 caminhos de diretórios fictícios (D:\Pesquisas\..., C:\Users\..., E:\Backup\...).
- **Descrição:** Deve mostrar os últimos 3 ou 4 diretórios que o usuário abriu para análise.
- **Sugestão de Implementação:** 
    - Ao abrir uma pasta nos módulos de Folhas ou Raízes, salvar o caminho absoluto e o timestamp em um array no `localStorage` ou em um arquivo `history.json` na pasta de dados do app (`app.getPath('userData')`).
    - Na Home, ler este array, ordenar por data e exibir os primeiros itens.
    - Clicar em um item deve levar o usuário diretamente para o módulo correspondente com aquela pasta já carregada.

### 2. Data de Última Modificação
- **Placeholder Atual:** Datas fixas (10/05/2024, etc).
- **Descrição:** Exibir quando aquele ensaio/pasta foi acessado ou processado pela última vez.
- **Sugestão de Implementação:** Capturar o `Date.now()` no momento da abertura ou do processamento final do pipeline e formatar como string legível.

---
*Documento gerado para orientação do time de Backend.*
