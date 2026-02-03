import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Check, X, Plus, ChevronDown, ChevronUp, Link2, Unlink, 
  AlertCircle, CheckCircle2, XCircle, FileQuestion, Sparkles 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCurrency } from '@/contexts/CurrencyContext';
import { BankLineWithMatch, MatchSuggestion } from '@/hooks/useReconciliation';
import { cn } from '@/lib/utils';
import { ReconcileManualDialog } from './ReconcileManualDialog';
import { CreateTransactionDialog } from './CreateTransactionFromLineDialog';

interface ReconciliationTableProps {
  bankLines: BankLineWithMatch[];
  walletId: string;
  onReconcile: (bankLineId: string, transactionId: string, matchType: 'auto' | 'manual', confidence?: number) => Promise<boolean>;
  onCreateTransaction: (bankLineId: string, category: string, supplier?: string) => Promise<boolean>;
  onIgnore: (bankLineId: string) => Promise<boolean>;
  onUndo: (bankLineId: string) => Promise<boolean>;
}

const statusConfig = {
  pending: {
    icon: AlertCircle,
    label: 'Pendente',
    variant: 'outline' as const,
    className: 'border-amber-500/50 text-amber-600 dark:text-amber-400',
  },
  reconciled: {
    icon: CheckCircle2,
    label: 'Conciliado',
    variant: 'outline' as const,
    className: 'border-green-500/50 text-green-600 dark:text-green-400',
  },
  created: {
    icon: Plus,
    label: 'Criado',
    variant: 'outline' as const,
    className: 'border-blue-500/50 text-blue-600 dark:text-blue-400',
  },
  ignored: {
    icon: XCircle,
    label: 'Ignorado',
    variant: 'outline' as const,
    className: 'border-muted-foreground/50 text-muted-foreground',
  },
};

export const ReconciliationTable = ({
  bankLines,
  walletId,
  onReconcile,
  onCreateTransaction,
  onIgnore,
  onUndo,
}: ReconciliationTableProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<BankLineWithMatch | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleQuickReconcile = async (line: BankLineWithMatch, suggestion: MatchSuggestion) => {
    await onReconcile(line.id, suggestion.transaction_id, 'auto', suggestion.confidence);
  };

  const handleManualReconcile = (line: BankLineWithMatch) => {
    setSelectedLine(line);
    setManualDialogOpen(true);
  };

  const handleCreateTransaction = (line: BankLineWithMatch) => {
    setSelectedLine(line);
    setCreateDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (bankLines.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t('reconciliation.noLines', 'Nenhuma linha de extrato importada')}</p>
        <p className="text-sm mt-2">{t('reconciliation.importHint', 'Importe um extrato bancário para começar')}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[30px]"></TableHead>
              <TableHead className="w-[100px]">{t('reconciliation.date', 'Data')}</TableHead>
              <TableHead className="w-[100px]">{t('reconciliation.bankCode', 'Código')}</TableHead>
              <TableHead>{t('reconciliation.description', 'Descrição')}</TableHead>
              <TableHead className="w-[120px]">{t('reconciliation.counterparty', 'Contraparte')}</TableHead>
              <TableHead className="w-[100px] text-right">{t('reconciliation.income', 'Entrada')}</TableHead>
              <TableHead className="w-[100px] text-right">{t('reconciliation.expense', 'Saída')}</TableHead>
              <TableHead className="w-[100px]">{t('reconciliation.status', 'Status')}</TableHead>
              <TableHead className="w-[100px]">{t('reconciliation.match', 'Match')}</TableHead>
              <TableHead className="w-[150px] text-right">{t('reconciliation.actions', 'Ações')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bankLines.map((line) => {
              const isExpanded = expandedRows.has(line.id);
              const status = statusConfig[line.reconciliation_status];
              const StatusIcon = status.icon;
              const hasSuggestions = line.suggestions.length > 0;
              const topSuggestion = line.suggestions[0];

              return (
                <Collapsible key={line.id} open={isExpanded} onOpenChange={() => toggleRow(line.id)}>
                  <TableRow 
                    className={cn(
                      "transition-colors",
                      line.reconciliation_status === 'pending' && "bg-amber-500/5",
                      line.reconciliation_status === 'reconciled' && "bg-green-500/5",
                      line.reconciliation_status === 'created' && "bg-blue-500/5",
                    )}
                  >
                    <TableCell>
                      {(hasSuggestions || line.matchedTransaction) && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatDate(line.transaction_date)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {line.bank_reference || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={line.description}>
                      {line.description}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
                      {line.counterparty || '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                      {line.amount > 0 ? formatCurrency(line.amount) : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                      {line.amount < 0 ? formatCurrency(Math.abs(line.amount)) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={cn("text-xs", status.className)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {line.reconciliation?.match_type === 'auto' && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-600">
                              <Sparkles className="w-3 h-3 mr-1" />
                              {line.reconciliation.confidence_score}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Match automático</TooltipContent>
                        </Tooltip>
                      )}
                      {line.reconciliation?.match_type === 'manual' && (
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="w-3 h-3 mr-1" />
                          Manual
                        </Badge>
                      )}
                      {line.reconciliation?.match_type === 'created' && (
                        <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-600">
                          <Plus className="w-3 h-3 mr-1" />
                          Novo
                        </Badge>
                      )}
                      {!line.reconciliation && hasSuggestions && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">
                              <Sparkles className="w-3 h-3 mr-1" />
                              {topSuggestion.confidence}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {line.suggestions.length} sugestão(ões)
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {!line.reconciliation && !hasSuggestions && line.reconciliation_status === 'pending' && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.reconciliation_status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          {topSuggestion && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 text-green-600 border-green-500/30 hover:bg-green-500/10"
                                  onClick={() => handleQuickReconcile(line, topSuggestion)}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Conciliar com sugestão</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7"
                                onClick={() => handleManualReconcile(line)}
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Vincular manualmente</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                                onClick={() => handleCreateTransaction(line)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Criar transação</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-7 text-muted-foreground"
                                onClick={() => onIgnore(line.id)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ignorar</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      {(line.reconciliation_status === 'reconciled' || line.reconciliation_status === 'created') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-7 text-muted-foreground"
                              onClick={() => onUndo(line.id)}
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Desfazer conciliação</TooltipContent>
                        </Tooltip>
                      )}
                      {line.reconciliation_status === 'ignored' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-7 text-muted-foreground"
                              onClick={() => onUndo(line.id)}
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voltar para pendente</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded content with suggestions or matched transaction */}
                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={10} className="p-4">
                        {line.matchedTransaction && (
                          <div className="bg-card border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">
                              Transação vinculada:
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{line.matchedTransaction.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(line.matchedTransaction.date)} • {line.matchedTransaction.category}
                                </p>
                              </div>
                              <p className="font-semibold tabular-nums">
                                {formatCurrency(line.matchedTransaction.amount)}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {!line.matchedTransaction && hasSuggestions && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium mb-3">
                              Sugestões de match ({line.suggestions.length}):
                            </p>
                            {line.suggestions.map((suggestion) => (
                              <div 
                                key={suggestion.transaction_id}
                                className="flex items-center justify-between bg-card border rounded-lg p-3 hover:border-primary/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium">{suggestion.description}</p>
                                    <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600">
                                      {suggestion.confidence}%
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(suggestion.date)} • {suggestion.category}
                                  </p>
                                  <div className="flex gap-1 mt-1">
                                    {suggestion.matchReasons.map((reason, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {reason}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="font-semibold tabular-nums">
                                    {formatCurrency(suggestion.amount)}
                                  </p>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleQuickReconcile(line, suggestion)}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Conciliar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Manual Reconcile Dialog */}
      {selectedLine && (
        <ReconcileManualDialog
          open={manualDialogOpen}
          onOpenChange={setManualDialogOpen}
          bankLine={selectedLine}
          walletId={walletId}
          onReconcile={async (transactionId) => {
            const success = await onReconcile(selectedLine.id, transactionId, 'manual');
            if (success) setManualDialogOpen(false);
          }}
        />
      )}

      {/* Create Transaction Dialog */}
      {selectedLine && (
        <CreateTransactionDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          bankLine={selectedLine}
          onCreate={async (category, supplier) => {
            const success = await onCreateTransaction(selectedLine.id, category, supplier);
            if (success) setCreateDialogOpen(false);
          }}
        />
      )}
    </TooltipProvider>
  );
};
