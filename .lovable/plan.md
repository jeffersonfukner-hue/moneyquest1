
# Plano: Botão Flutuante de Nova Transação

## Situação Atual

| Local | Visível | Problema |
|-------|---------|----------|
| UnifiedTopbar (linha 133-145) | Só na topbar | Desaparece ao rolar a página |
| FloatingWhatsAppButton | Sempre visível | Apenas para WhatsApp |

O botão "Novo" existe na topbar, mas **não é visível ao rolar a página** ou quando o usuário está focado em outra área.

## Solução

Criar um **botão flutuante fixo** (FAB - Floating Action Button) que:
- Fica **sempre visível** em qualquer tela
- Posicionado no canto inferior direito (acima do botão WhatsApp)
- Abre o mesmo `AddTransactionDialog` existente
- Design chamativo com ícone `+`

## Alterações

### Arquivo 1: Novo `src/components/game/FloatingAddButton.tsx`

Componente flutuante independente:

```text
Estrutura:
- Botão fixo com position: fixed
- z-index: 50 (acima do conteúdo, abaixo de modais)
- Posição: bottom-40 right-4 (acima do WhatsApp que está em bottom-24)
- Usa AddTransactionDialog existente
- Usa useTransactions() para função addTransaction
```

### Arquivo 2: `src/components/layout/AppShell.tsx`

Adicionar o componente flutuante junto aos outros elementos globais:

```typescript
// Linha 7: importar
import { FloatingAddButton } from '@/components/game/FloatingAddButton';

// Linha 89: adicionar após FloatingWhatsAppButton
<FloatingAddButton />
<FloatingWhatsAppButton />
```

## Posicionamento Visual

```text
┌─────────────────────────┐
│                         │
│      Conteúdo da        │
│         Página          │
│                         │
│                   [+]  ←── Novo botão (bottom-40)
│                   [W]  ←── WhatsApp (bottom-24)
│                         │
└─────────────────────────┘
```

## Design do Botão

| Propriedade | Valor |
|-------------|-------|
| Tamanho | 56x56px (w-14 h-14) |
| Cor | bg-primary (verde/accent do tema) |
| Ícone | Plus (lucide-react) |
| Sombra | shadow-lg com hover:shadow-xl |
| Animação | scale-95 ao clicar, pulse sutil |
| Z-index | 50 |

## Resultado Esperado

- Não importa onde você esteja no app, o botão `+` está sempre visível
- Clicar abre o dialog de nova transação
- Funciona em mobile, tablet e desktop
- Não interfere com o botão do WhatsApp (posicionado acima)
