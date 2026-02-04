
# Plano: Edição e Exclusão de Transações no Drill-down

## Problema Identificado

Atualmente, ao clicar em uma transação no painel **"Ver todas"** (`TransactionDrilldown`), nada acontece. O usuário precisa poder:
1. **Editar** a transação (reaproveitando o `EditTransactionDialog` existente)
2. **Excluir** a transação com confirmação
3. Ver **confirmação antes de salvar**
4. Ver **vínculos** da transação antes de excluir (cartão de crédito, fatura, etc.)

---

## Análise dos Vínculos Possíveis

Uma transação pode ter os seguintes vínculos:

| Campo | Vínculo | Descrição |
|-------|---------|-----------|
| `credit_card_id` | Cartão de Crédito | Transação lançada no cartão |
| `invoice_id` | Fatura | Transação pertence a uma fatura |
| `wallet_id` | Carteira | Conta/carteira vinculada |
| `has_items` | Itens Detalhados | Tem breakdown de itens (premium) |

---

## Solução Proposta

### 1. Tornar linhas clicáveis no TransactionDrilldown

Adicionar `onClick` nas `TableRow` para abrir o dialog de edição.

### 2. Modificar o EditTransactionDialog

Adicionar:
- **Botão de Excluir** (vermelho, com ícone de lixeira)
- **Confirmação ao Salvar** (AlertDialog perguntando "Tem certeza?")
- **Confirmação ao Excluir** com informações de vínculos

### 3. Mostrar Vínculos antes de Excluir

Se a transação tem vínculos, exibir:

```text
┌───────────────────────────────────────────┐
│ ⚠️ Excluir transação?                      │
├───────────────────────────────────────────┤
│ Esta transação possui vínculos:           │
│                                           │
│ 💳 Cartão: Nubank Platinum                │
│ 📄 Fatura: Janeiro/2025                   │
│ 🏦 Carteira: Conta Corrente BB            │
│                                           │
│ Ao excluir, os saldos serão recalculados. │
├───────────────────────────────────────────┤
│ [Cancelar]              [Excluir mesmo]   │
└───────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/reports/TransactionDrilldown.tsx` | Adicionar estado + props para edição/exclusão |
| `src/components/game/EditTransactionDialog.tsx` | Adicionar botão excluir + confirmações |
| `src/i18n/locales/pt-BR.json` | Novas traduções para confirmações |

---

## Implementação Técnica

### TransactionDrilldown.tsx

1. **Novas props**:
```tsx
interface TransactionDrilldownProps {
  // ... existentes
  onUpdate?: (id: string, updates: Partial<Transaction>) => Promise<{ error: Error | null }>;
  onDelete?: (id: string) => Promise<{ error: Error | null }>;
}
```

2. **Estado para edição**:
```tsx
const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
```

3. **Linha clicável**:
```tsx
<TableRow 
  key={tx.id} 
  className="cursor-pointer hover:bg-muted/50"
  onClick={() => setEditingTransaction(tx)}
>
```

4. **Dialog de edição**:
```tsx
{editingTransaction && onUpdate && onDelete && (
  <EditTransactionDialog
    transaction={editingTransaction}
    open={!!editingTransaction}
    onOpenChange={(open) => !open && setEditingTransaction(null)}
    onUpdate={onUpdate}
    onDelete={onDelete}
  />
)}
```

### EditTransactionDialog.tsx

1. **Nova prop `onDelete`**:
```tsx
interface EditTransactionDialogProps {
  // ... existentes
  onDelete?: (id: string) => Promise<{ error: Error | null }>;
}
```

2. **Novos estados**:
```tsx
const [showSaveConfirm, setShowSaveConfirm] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

3. **Botão Salvar com confirmação**:
```tsx
// Ao clicar em Salvar
onClick={() => setShowSaveConfirm(true)}

// AlertDialog de confirmação
<AlertDialog open={showSaveConfirm}>
  "Tem certeza que deseja salvar as alterações?"
  [Cancelar] [Sim, salvar]
</AlertDialog>
```

4. **Botão Excluir com vínculos**:
```tsx
<Button variant="outline" className="text-destructive" onClick={() => setShowDeleteConfirm(true)}>
  <Trash2 /> Excluir
</Button>

// AlertDialog mostrando vínculos
<AlertDialog open={showDeleteConfirm}>
  {hasLinks && (
    <div className="bg-amber-500/10 p-3 rounded-lg">
      <p>Esta transação possui vínculos:</p>
      {linkedCard && <p>💳 Cartão: {linkedCard.name}</p>}
      {transaction.invoice_id && <p>📄 Fatura vinculada</p>}
      {walletName && <p>🏦 Carteira: {walletName}</p>}
    </div>
  )}
  [Cancelar] [Excluir]
</AlertDialog>
```

---

## Fluxo de Usuário Final

```text
Dashboard → Ver todas → Clica na transação
    │
    ▼
┌─────────────────────────────────────────────┐
│ ✏️ Editar Transação                          │
├─────────────────────────────────────────────┤
│ 💳 Nubank (se for cartão)                   │
│                                             │
│ Tipo: [Despesa ▼]                           │
│ Fornecedor: [___________]                   │
│ Descrição: [MERCADO ABC]                    │
│ Valor: R$ [150.00]                          │
│ Categoria: [🛒 Alimentação ▼]               │
│ Data: [15/01/2025]                          │
│                                             │
│ ┌─────────────────┐  ┌─────────────────────┐│
│ │🗑️ Excluir       │  │       💾 Salvar     ││
│ └─────────────────┘  └─────────────────────┘│
└─────────────────────────────────────────────┘
    │                      │
    ▼                      ▼
[Confirmar exclusão]   [Confirmar salvamento]
```

---

## Traduções a Adicionar

```json
{
  "transactions": {
    "confirmSave": "Confirmar alterações",
    "confirmSaveDesc": "Tem certeza que deseja salvar as alterações nesta transação?",
    "confirmDelete": "Excluir transação",
    "confirmDeleteDesc": "Esta ação não pode ser desfeita.",
    "hasLinks": "Esta transação possui vínculos:",
    "linkedCard": "Cartão",
    "linkedInvoice": "Fatura vinculada",
    "linkedWallet": "Carteira",
    "deleteAnyway": "Excluir mesmo assim"
  }
}
```

---

## Resultado Esperado

1. Clicar em qualquer transação no drill-down abre o dialog de edição
2. Botão **Salvar** pede confirmação antes de aplicar
3. Botão **Excluir** mostra vínculos (se existirem) e pede confirmação
4. Após salvar/excluir, a lista é atualizada automaticamente
5. Transações em meses fechados continuam bloqueadas (comportamento existente)
