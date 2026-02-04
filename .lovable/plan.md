

# Plano: Implementar Busca Funcional de Transações

## Problema

A busca global no `DesktopTopbar` é apenas visual - não filtra dados. O código está marcado como "TODO: implement full search".

## Solução Proposta

Implementar busca funcional que:
1. Filtra transações por descrição, categoria, fornecedor
2. Mostra resultados em tempo real no modal
3. Permite clicar para navegar até a transação

## Alterações Necessárias

### Arquivo 1: `src/components/layout/DesktopTopbar.tsx`

- Adicionar estado para termo de busca
- Integrar com `useTransactions()` para buscar dados
- Renderizar lista de resultados filtrados
- Navegação ao clicar no resultado

### Arquivo 2: Novo componente `src/components/search/GlobalSearchModal.tsx`

Componente dedicado para a busca global com:
- Input com debounce (300ms)
- Filtro por descrição, categoria, fornecedor
- Lista de resultados com destaque do termo buscado
- Navegação via teclado (setas + Enter)
- Limite de 10 resultados para performance

## Detalhes Técnicos

```text
Lógica de Filtro:
- Converte termo para lowercase
- Busca em: description, category, supplier
- Ordena por data (mais recente primeiro)
- Limita a 10 resultados

Estrutura do Resultado:
- Descrição (destacando match)
- Categoria + Data
- Valor formatado
- Ícone de tipo (receita/despesa)
```

## Fluxo de Uso

1. Usuário clica na busca ou pressiona `/` ou `⌘K`
2. Modal abre com input focado
3. Ao digitar, resultados aparecem instantaneamente
4. Clicar em resultado navega para `/transactions?highlight={id}`
5. ESC ou clicar fora fecha o modal

## Resultado Esperado

Buscar "APORTE INICIAL" mostrará a transação de Janeiro/2025, permitindo navegação direta.

