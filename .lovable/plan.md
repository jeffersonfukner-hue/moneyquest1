
# Plano: Adicionar Conciliação e Dinheiro ao Menu

## Problema Identificado

O menu lateral (`AppSidebar.tsx`) não contém os itens **Conciliação Bancária** e **Dinheiro (CASH)**, apesar das rotas e funcionalidades já existirem no sistema.

### Análise Técnica

| Item | Rota | Status |
|------|------|--------|
| Conciliação | `/wallets/reconciliation` | ✅ Existe, mas não está no menu |
| Dinheiro | `/wallets/accounts` | ✅ Aparece dentro de "Contas" como tipo de carteira |

---

## Solução Proposta

### 1. Adicionar "Conciliação" ao submenu de Carteiras

Incluir o item **Conciliação** no array `walletsSubItems` do `AppSidebar.tsx`:

```text
Carteiras
├── Contas
├── Cartões
├── Cheques
├── Empréstimos
├── Transferências
└── Conciliação ← NOVO
```

**Ícone sugerido:** `Scale` (balança - já usado na página de conciliação)

### 2. Adicionar tradução

Incluir a chave `sidebar.reconciliation` no arquivo `pt-BR.json`:

```json
"sidebar": {
  ...
  "reconciliation": "Conciliação"
}
```

---

## Sobre o Dinheiro (CASH)

O **Dinheiro em espécie** já aparece na seção **Contas** junto com as outras carteiras do tipo `cash`. 

**Duas opções para melhor visibilidade:**

| Opção | Descrição |
|-------|-----------|
| A) Manter como está | Dinheiro continua aparecendo dentro de "Contas" |
| B) Adicionar item separado | Criar sub-item "Dinheiro" que filtra apenas carteiras tipo `cash` |

**Recomendação:** Opção A (manter), pois "Dinheiro" é apenas um tipo de carteira e já está corretamente integrado no fluxo de Contas.

---

## Arquivos a Modificar

1. **`src/components/layout/AppSidebar.tsx`**
   - Importar ícone `Scale` de `lucide-react`
   - Adicionar item `{ title: 'reconciliation', url: APP_ROUTES.WALLETS_RECONCILIATION, icon: Scale }` ao array `walletsSubItems`

2. **`src/i18n/locales/pt-BR.json`**
   - Adicionar `"reconciliation": "Conciliação"` na seção `sidebar`

---

## Resultado Esperado

Após a implementação, o menu ficará:

```text
📊 Dashboard
📁 Carteiras
   ├── 💵 Contas
   ├── 💳 Cartões
   ├── 📄 Cheques
   ├── 🏛️ Empréstimos
   ├── ↔️ Transferências
   └── ⚖️ Conciliação  ← NOVO
📅 Agendados
👥 Fornecedores
🎯 Metas
📈 Relatórios
```
