
# Plano: Dashboard Financeiro Profissional (Sem Gamificacao)

## Visao Geral

Redesenhar completamente o Dashboard do MoneyQuest para um layout profissional, financeiro-first, removendo **todos** os elementos de gamificacao. O foco sera clareza, tomada de decisao e leitura financeira confiavel.

---

## Elementos a Remover

### 1. Componentes de Gamificacao

| Componente | Localizacao | Acao |
|------------|-------------|------|
| `GamificationSidebar` | `src/components/dashboard/GamificationSidebar.tsx` | Deletar arquivo |
| `DailyRewardBanner` | `src/components/game/DailyRewardBanner.tsx` | Remover do Dashboard |
| `DailyRewardDialog` | `src/components/game/DailyRewardDialog.tsx` | Remover do Dashboard |
| `QuestCelebration` | `src/components/game/QuestCelebration.tsx` | Remover do Dashboard |
| `SeasonalDecorations` | `src/components/game/SeasonalDecorations.tsx` | Remover do Dashboard |
| `XPNotification` | `src/components/game/XPNotification.tsx` | Remover do Dashboard |
| `TransactionFeedback` | `src/components/game/TransactionFeedback.tsx` | Simplificar para feedback neutro |
| `SessionSummaryCard` | `src/components/game/SessionSummaryCard.tsx` | Remover XP, manter resumo financeiro |
| `TierUpgradeCelebration` | `src/components/referral/TierUpgradeCelebration.tsx` | Remover do Dashboard |
| `QuickTemplates` | `src/components/game/QuickTemplates.tsx` | Manter mas remover elementos visuais de jogo |

### 2. Hooks de Gamificacao no Dashboard

Remover do `Index.tsx`:
- `useQuests` - nao necessario no dashboard
- `useBadges` - nao necessario no dashboard
- `useDailyReward` - nao necessario no dashboard
- `useRealtimeXP` - nao necessario no dashboard
- `useReferralNotifications` - nao necessario no dashboard

### 3. Navegacao - Sidebar

Atualizar `AppSidebar.tsx`:
- Remover secao "Gamificacao" (Leaderboard, Journal, Shop)
- Manter apenas navegacao financeira essencial
- Remover exibicao de "Nivel" no perfil do usuario

### 4. Topbar

Atualizar `UnifiedTopbar.tsx`:
- Remover `SoundToggle`
- Remover `SeasonalThemeIndicator`

---

## Nova Estrutura do Dashboard

### Layout Desktop (1280px+)

```text
+-----------------------------------------------+
|  Topbar (limpo, sem elementos de jogo)        |
+-----------------------------------------------+
|           KPIs Essenciais (4 cards)           |
+-----------------------------------------------+
|     Indice de Organizacao Financeira (1 linha)|
+-----------------------------------------------+
|  Resultado do Periodo  |   Analise de Gastos  |
|  (Entradas/Saidas/Net) |   (Top 5 Categorias) |
+------------------------+----------------------+
|         Evolucao de Saldo (Grafico)           |
+-----------------------------------------------+
|         Alertas Financeiros (se houver)       |
+-----------------------------------------------+
|         Ultimas Transacoes (8-10 itens)       |
+-----------------------------------------------+
|         Templates Rapidos (simplificado)      |
+-----------------------------------------------+
```

### Mobile/Tablet

Mesmo conteudo empilhado verticalmente, financeiro sempre primeiro.

---

## Novos Componentes

### 1. Indice de Organizacao Financeira

Criar `src/components/dashboard/OrganizationIndexWidget.tsx`:

```typescript
// Widget discreto mostrando pontuacao funcional
// Linha unica abaixo dos KPIs
// Criterios: registros em dia, metas definidas, conciliacao

interface OrganizationIndex {
  score: number;       // 0-100
  level: string;       // "Excelente" | "Bom" | "Regular" | "Atencao"
  tooltip: string;     // Explicacao dos criterios
}
```

Criterios de calculo:
- Registros nos ultimos 7 dias: +30 pontos
- Pelo menos 1 meta de categoria definida: +20 pontos
- Todas as carteiras com saldo atualizado: +20 pontos
- Nenhum alerta financeiro ativo: +15 pontos
- Pelo menos 3 categorias usadas no mes: +15 pontos

### 2. Grafico de Evolucao de Saldo

Criar `src/components/dashboard/BalanceEvolutionChart.tsx`:

```typescript
// Grafico de linha simples mostrando evolucao do saldo ao longo do periodo
// Sem animacoes exageradas
// Cores neutras: linha principal, area preenchida suave
```

### 3. Feedback de Transacao Simplificado

Criar `src/components/dashboard/TransactionConfirmation.tsx`:

```typescript
// Substituir TransactionFeedback
// Mostra apenas: confirmacao de registro, valor, categoria
// Sem narrativas, sem XP, sem animacoes elaboradas
// Auto-dismiss em 3 segundos
```

### 4. Resumo de Sessao Simplificado

Atualizar `SessionSummaryCard.tsx`:

```typescript
// Remover: XP, trofeu, "Mission Complete", termos de jogo
// Manter: total de transacoes, entradas, saidas, saldo liquido
// Renomear para "Resumo de Lancamentos"
```

---

## Arquivos a Modificar

### Alteracoes Principais

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Index.tsx` | Remover todos hooks/componentes de gamificacao, simplificar layout |
| `src/components/dashboard/index.ts` | Remover export de GamificationSidebar, adicionar novos |
| `src/components/layout/AppSidebar.tsx` | Remover secao gamificacao, remover nivel do perfil |
| `src/components/layout/UnifiedTopbar.tsx` | Remover SoundToggle, SeasonalThemeIndicator |
| `src/components/game/SessionSummaryCard.tsx` | Remover XP e termos de jogo |
| `src/components/game/QuickTemplates.tsx` | Remover visual de jogo, manter funcionalidade |

### Novos Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/components/dashboard/OrganizationIndexWidget.tsx` | Pontuacao funcional discreta |
| `src/components/dashboard/BalanceEvolutionChart.tsx` | Grafico de evolucao de saldo |
| `src/components/dashboard/TransactionConfirmation.tsx` | Feedback simplificado |

### Arquivos a Deletar (do Dashboard)

O `GamificationSidebar.tsx` sera deletado. Os demais componentes de gamificacao permanecem para uso em outras areas do app, mas serao removidos do Dashboard.

---

## Regras de Calculo Financeiro

### Transferencias

- Transferencias entre carteiras NAO contam como entrada/saida
- Filtrar por `transaction_subtype !== 'transfer'` ou similar

### Pagamento de Cartao

- Pagamento de fatura NAO gera nova despesa
- Ja foi registrado como despesa na transacao original

### Emprestimos

- Entrada inicial do emprestimo: conta como entrada
- Parcelas: sao pagamento de divida, nao despesa recorrente

### Lancamentos Futuros

- Entram apenas na projecao de caixa (30 dias)
- Nao afetam saldo atual ou resultado do periodo

---

## Visual e UX

### Paleta de Cores

```text
Neutros:
- Background: hsl(var(--background))
- Card: hsl(var(--card))
- Border: hsl(var(--border))

Dados Financeiros:
- Positivo/Receita: hsl(var(--success)) - verde discreto
- Negativo/Despesa: hsl(var(--destructive)) - vermelho discreto
- Neutro: hsl(var(--muted-foreground))
```

### Tipografia

- Titulos de cards: `text-sm font-medium text-muted-foreground`
- Valores principais: `text-lg lg:text-xl font-bold tabular-nums`
- Legendas: `text-xs text-muted-foreground`

### Icones

- Usar icones Lucide neutros (sem emojis de jogo)
- `Wallet`, `TrendingUp`, `TrendingDown`, `CreditCard`, `AlertTriangle`

---

## Ordem de Implementacao

1. **Limpar Index.tsx**
   - Remover imports de gamificacao
   - Remover hooks nao necessarios
   - Remover componentes de jogo do render

2. **Atualizar Sidebar**
   - Remover secao gamificacao
   - Remover nivel do perfil

3. **Atualizar Topbar**
   - Remover SoundToggle
   - Remover SeasonalThemeIndicator

4. **Criar OrganizationIndexWidget**
   - Calcular pontuacao
   - Exibir de forma discreta

5. **Criar BalanceEvolutionChart**
   - Grafico de linha com Recharts
   - Dados do periodo atual

6. **Simplificar SessionSummaryCard**
   - Remover XP e termos de jogo
   - Manter resumo financeiro

7. **Criar TransactionConfirmation**
   - Substituir TransactionFeedback no dashboard
   - Feedback neutro e rapido

8. **Deletar GamificationSidebar**
   - Remover do barrel export
   - Deletar arquivo

9. **Atualizar traducoes**
   - Adicionar novas keys
   - Remover referencias a gamificacao no dashboard

---

## Resultado Esperado

### Antes (Gamificado)

- Avatar, nivel, XP, streak, multiplicador
- Daily Reward banners e dialogs
- Quest celebrations
- Decoracoes sazonais
- Feedback narrativo com animacoes
- Sidebar com Leaderboard, Journal, Shop

### Depois (Profissional)

- KPIs financeiros claros e clicaveis
- Indice de Organizacao discreto
- Graficos uteis e simples
- Alertas financeiros explicativos
- Feedback de transacao neutro
- Sidebar apenas com funcionalidades financeiras
- Visual limpo e profissional

---

## Testes Recomendados

1. **Desktop**: Dashboard com layout limpo e profissional
2. **Mobile**: Widgets empilhados corretamente
3. **KPIs**: Cliques levando para drill-down correto
4. **Alertas**: Aparecendo/desaparecendo conforme situacao
5. **Graficos**: Exibindo dados corretamente
6. **Indice**: Calculando pontuacao baseada nos criterios
