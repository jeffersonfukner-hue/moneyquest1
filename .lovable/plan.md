
# Plano: Opção de Excluir Conta Bancária (Wallet)

## Situação Atual

| Opção | Existe? | Comportamento |
|-------|---------|---------------|
| Desativar | ✅ Sim | Soft delete - carteira fica oculta mas dados permanecem |
| Excluir | ❌ Não | Não existe opção de remoção permanente |

Atualmente, o menu de opções da carteira (`WalletCard.tsx`, linhas 97-110) só oferece "Desativar/Reativar". Não há opção para excluir permanentemente.

## Solução

Adicionar opção **"Excluir"** no menu dropdown da carteira, com dialog de confirmação, que remove a carteira e suas transações associadas do banco de dados.

## Alterações Necessárias

### Arquivo 1: `src/hooks/useWallets.tsx`

Adicionar nova função `permanentlyDeleteWallet`:

```text
Nova função:
- Verifica se carteira tem transações vinculadas
- Exclui transações associadas (wallet_id = id)
- Exclui transferências associadas (from_wallet_id ou to_wallet_id = id)
- Exclui a carteira do banco
- Emite evento de sincronização
```

### Arquivo 2: `src/components/wallets/WalletCard.tsx`

Adicionar item "Excluir" no dropdown menu (após Desativar):

```text
Novo item de menu:
- Ícone: Trash2 (vermelho)
- Texto: "Excluir permanentemente"
- Cor: text-destructive
- Separador visual antes do item
```

### Arquivo 3: Novo `src/components/wallets/DeleteWalletDialog.tsx`

Dialog de confirmação com aviso sobre consequências:

```text
Conteúdo do Dialog:
- Título: "Excluir Carteira"
- Aviso: "Esta ação é irreversível"
- Info: quantidade de transações que serão excluídas
- Input: digitar nome da carteira para confirmar
- Botões: Cancelar / Excluir (desabilitado até confirmar)
```

### Arquivo 4: `src/pages/Wallets.tsx`

- Adicionar estado para controlar dialog de exclusão
- Adicionar handler `handlePermanentDelete`
- Passar props para WalletCard

### Arquivo 5: `src/i18n/locales/pt-BR.json`

Adicionar traduções:

```json
"wallets": {
  "deletePermanently": "Excluir permanentemente",
  "deleteTitle": "Excluir Carteira",
  "deleteWarning": "Esta ação é irreversível. A carteira e todas as transações vinculadas serão excluídas.",
  "deleteConfirmLabel": "Digite o nome da carteira para confirmar:",
  "deleteNameMismatch": "O nome digitado não corresponde",
  "deleteSuccess": "Carteira excluída permanentemente",
  "deleteError": "Erro ao excluir carteira",
  "linkedTransactions": "{{count}} transações serão excluídas",
  "linkedTransfers": "{{count}} transferências serão excluídas"
}
```

## Fluxo do Usuário

```text
Menu da carteira (...)
    ↓
Clica "Excluir permanentemente"
    ↓
Dialog abre mostrando:
  - Nome da carteira
  - Quantidade de transações vinculadas
  - Quantidade de transferências vinculadas
    ↓
Digita nome da carteira para confirmar
    ↓
Clica "Excluir"
    ↓
Carteira + dados vinculados removidos
    ↓
Toast: "Carteira excluída permanentemente"
```

## Segurança

| Proteção | Implementação |
|----------|---------------|
| Confirmação por nome | Usuário deve digitar nome exato da carteira |
| Aviso visual | Ícone vermelho + texto de aviso |
| Preview do impacto | Mostra quantas transações serão afetadas |
| Separador no menu | Item de exclusão visualmente separado |

## Resultado Esperado

- Nova opção "Excluir permanentemente" no menu de cada carteira
- Dialog de confirmação seguro
- Remoção completa da carteira e dados vinculados
- Sincronização automática em todas as telas

