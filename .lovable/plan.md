
# Sistema de Backup de Dados

## Objetivo
Criar uma funcionalidade completa de backup que permite ao usuário exportar e importar todos os seus dados financeiros, integrada à página de Configurações.

---

## Funcionalidades

### 1. Exportar Dados (Backup)
- Exportar todos os dados do usuário em formato JSON
- Arquivo único com timestamp no nome
- Dados incluídos:
  - Transações
  - Carteiras
  - Categorias personalizadas
  - Metas de categoria
  - Cartões de crédito
  - Faturas de cartão
  - Empréstimos
  - Templates de transação
  - Transferências entre carteiras
  - Fornecedores
  - Recompensas pessoais
  - Transações agendadas

### 2. Importar Dados (Restaurar)
- Upload de arquivo JSON de backup
- Validação do formato antes da importação
- Opção de mesclar ou substituir dados existentes
- Feedback de progresso durante importação

---

## Arquivos a Criar/Modificar

### 1. **`src/hooks/useBackup.tsx`** (NOVO)
Hook que gerencia toda a lógica de backup:
- `exportBackup()` - Busca todos os dados e gera arquivo JSON
- `importBackup(file)` - Processa arquivo e insere dados
- `validateBackup(data)` - Valida estrutura do arquivo
- Estados de loading e progresso

### 2. **`src/components/settings/BackupCard.tsx`** (NOVO)
Componente visual para a seção de backup:
- Botão "Exportar Backup"
- Botão "Importar Backup" com input de arquivo
- Exibição do último backup realizado
- Indicadores de progresso

### 3. **`src/pages/Settings.tsx`** (MODIFICAR)
- Importar e adicionar `BackupCard` na lista de cards
- Posicionar após Notificações e antes de Som

---

## Estrutura do Arquivo de Backup

```json
{
  "version": "1.0",
  "exportedAt": "2026-02-03T12:00:00Z",
  "userId": "uuid",
  "data": {
    "transactions": [...],
    "wallets": [...],
    "categories": [...],
    "categoryGoals": [...],
    "creditCards": [...],
    "creditCardInvoices": [...],
    "loans": [...],
    "transactionTemplates": [...],
    "walletTransfers": [...],
    "suppliers": [...],
    "personalRewards": [...],
    "scheduledTransactions": [...]
  }
}
```

---

## Fluxo de Exportação

```text
┌─────────────────────────────────────────────────┐
│  Usuário clica em "Exportar Backup"             │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Buscar dados de todas as tabelas do usuário    │
│  (paralelo para performance)                    │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Montar objeto JSON com metadados               │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Gerar arquivo e iniciar download               │
│  Nome: moneyquest-backup-YYYY-MM-DD.json        │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Toast de sucesso                               │
└─────────────────────────────────────────────────┘
```

---

## Fluxo de Importação

```text
┌─────────────────────────────────────────────────┐
│  Usuário seleciona arquivo de backup            │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Ler e validar JSON                             │
└─────────────────────────────────────────────────┘
                    │
         ┌─────────┴─────────┐
         │                   │
    Inválido             Válido
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────────────────┐
│ Toast de erro   │  │  Mostrar diálogo de         │
└─────────────────┘  │  confirmação                │
                     └─────────────────────────────┘
                                 │
                                 ▼
                     ┌─────────────────────────────┐
                     │  Inserir dados em ordem     │
                     │  (categorias primeiro,      │
                     │   depois transações)        │
                     └─────────────────────────────┘
                                 │
                                 ▼
                     ┌─────────────────────────────┐
                     │  Toast de sucesso           │
                     │  + Atualizar página         │
                     └─────────────────────────────┘
```

---

## Interface Visual

O card de backup terá:
- Ícone de download/upload
- Título "Backup de Dados"
- Subtítulo explicativo
- Dois botões:
  - **Exportar**: Azul/primário, ícone de download
  - **Importar**: Outline, ícone de upload
- Texto pequeno com data do último backup (se houver)

---

## Detalhes Técnicos

### Ordem de Importação (para evitar erros de FK)
1. Categorias
2. Carteiras
3. Fornecedores
4. Cartões de crédito
5. Faturas de cartão
6. Metas de categoria
7. Transações
8. Templates de transação
9. Transferências
10. Transações agendadas
11. Empréstimos
12. Recompensas pessoais

### Tratamento de Conflitos
- Categorias default são puladas (já existem)
- IDs são regenerados na importação
- user_id é substituído pelo usuário atual

### Segurança
- Validação de estrutura JSON
- Verificação de versão do backup
- Limite de tamanho de arquivo (10MB)

---

## Traduções a Adicionar (pt-BR.json)

```json
{
  "backup": {
    "title": "Backup de Dados",
    "subtitle": "Exporte ou importe seus dados financeiros",
    "export": "Exportar Backup",
    "import": "Importar Backup",
    "exporting": "Exportando...",
    "importing": "Importando...",
    "exportSuccess": "Backup exportado com sucesso!",
    "exportError": "Erro ao exportar backup",
    "importSuccess": "Backup importado com sucesso!",
    "importError": "Erro ao importar backup",
    "invalidFile": "Arquivo de backup inválido",
    "confirmImport": "Confirmar Importação",
    "confirmImportDesc": "Isso irá adicionar os dados do backup à sua conta. Deseja continuar?",
    "lastBackup": "Último backup"
  }
}
```

---

## Resumo das Mudanças

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useBackup.tsx` | Criar | Hook com lógica de export/import |
| `src/components/settings/BackupCard.tsx` | Criar | Componente visual do backup |
| `src/pages/Settings.tsx` | Editar | Adicionar BackupCard |
| `src/i18n/locales/pt-BR.json` | Editar | Adicionar traduções de backup |
