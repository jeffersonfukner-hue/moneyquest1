import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, CreditCard, Wallet, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useBankStatementImport, ParsedTransaction } from '@/hooks/useBankStatementImport';
import { useCategories } from '@/hooks/useCategories';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface CreditCard {
  id: string;
  name: string;
  bank: string;
}

interface BankStatementImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditCards: CreditCard[];
  onImport: (transactions: ParsedTransaction[]) => Promise<void>;
}

export const BankStatementImportDialog = ({
  open,
  onOpenChange,
  creditCards,
  onImport,
}: BankStatementImportDialogProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { getCategoriesByType } = useCategories();
  const { activeWallets } = useWallets();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState('');
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const {
    loading,
    transactions,
    error,
    parseFile,
    parseText,
    toggleTransaction,
    toggleAll,
    updateTransaction,
    linkInvoiceToCard,
    getSelectedTransactions,
    reset,
  } = useBankStatementImport();

  const expenseCategories = getCategoriesByType('EXPENSE');
  const incomeCategories = getCategoriesByType('INCOME');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await parseFile(file);
    }
  };

  const handlePasteSubmit = async () => {
    if (pastedText.trim()) {
      await parseText(pastedText);
    }
  };

  const handleImport = async () => {
    const selected = getSelectedTransactions();
    if (selected.length === 0) return;

    setImporting(true);
    try {
      await onImport(selected);
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    reset();
    setPastedText('');
    onOpenChange(false);
  };

  const selectedCount = transactions.filter(t => t.selected).length;
  const invoicePayments = transactions.filter(t => t.isInvoicePayment);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('import.title', 'Importar Extrato Bancário')}
          </DialogTitle>
        </DialogHeader>

        {transactions.length === 0 ? (
          <Tabs defaultValue="file" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <FileText className="w-4 h-4 mr-2" />
                {t('import.uploadFile', 'Arquivo')}
              </TabsTrigger>
              <TabsTrigger value="paste">
                <FileText className="w-4 h-4 mr-2" />
                {t('import.pasteText', 'Colar Texto')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  loading && "opacity-50 pointer-events-none"
                )}
              >
                {loading ? (
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                )}
                <p className="text-sm font-medium">
                  {loading 
                    ? t('import.processing', 'Processando...')
                    : t('import.dropHere', 'Clique ou arraste o arquivo aqui')
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('import.supportedFormats', 'CSV, TXT ou PDF')}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.pdf,.ofx"
                onChange={handleFileChange}
                className="hidden"
              />
            </TabsContent>

            <TabsContent value="paste" className="mt-4 space-y-4">
              <Textarea
                placeholder={t('import.pasteHint', 'Cole o extrato aqui...\n\nExemplo:\n15/01/2024 SUPERMERCADO XYZ -150,00\n16/01/2024 SALÁRIO +3000,00')}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <Button 
                onClick={handlePasteSubmit} 
                disabled={!pastedText.trim() || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {t('import.process', 'Processar')}
              </Button>
            </TabsContent>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </Tabs>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Error from parsing */}
            {parseError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {/* Invoice Payment Alerts */}
            {invoicePayments.length > 0 && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  {t('import.invoiceDetected', 'Detectamos {{count}} pagamento(s) de fatura. Deseja vincular a um cartão?', { count: invoicePayments.length })}
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction List */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCount === transactions.length}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {t('import.selectAll', 'Selecionar todos')} ({selectedCount}/{transactions.length})
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 pb-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={cn(
                      "border rounded-lg p-3 transition-colors",
                      tx.selected ? "border-primary/50 bg-primary/5" : "border-border opacity-60",
                      tx.isInvoicePayment && tx.selected && "border-amber-500/30 bg-amber-500/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={tx.selected}
                        onCheckedChange={() => toggleTransaction(tx.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Transaction header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{tx.description}</span>
                          {tx.isInvoicePayment && (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/50 text-xs">
                              <CreditCard className="w-3 h-3 mr-1" />
                              {t('import.invoicePayment', 'Fatura')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className={tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>

                        {/* Selection options when selected */}
                        {tx.selected && (
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                            {/* Destination Type: Account or Credit Card */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">
                                {t('import.destinationType', 'Lançar em:')}
                              </Label>
                              <RadioGroup
                                value={tx.destinationType}
                                onValueChange={(value: 'account' | 'credit_card') => 
                                  updateTransaction(tx.id, { destinationType: value })
                                }
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="account" id={`${tx.id}-account`} />
                                  <Label htmlFor={`${tx.id}-account`} className="text-sm flex items-center gap-1 cursor-pointer">
                                    <Wallet className="w-3.5 h-3.5" />
                                    {t('import.bankAccount', 'Conta Bancária')}
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="credit_card" id={`${tx.id}-card`} />
                                  <Label htmlFor={`${tx.id}-card`} className="text-sm flex items-center gap-1 cursor-pointer">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    {t('import.creditCard', 'Cartão de Crédito')}
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* Account selection */}
                            {tx.destinationType === 'account' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t('import.category', 'Categoria')}</Label>
                                  <Select
                                    value={tx.category || ''}
                                    onValueChange={(value) => updateTransaction(tx.id, { category: value })}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder={t('import.selectCategory', 'Selecionar...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(tx.type === 'INCOME' ? incomeCategories : expenseCategories).map((cat) => (
                                        <SelectItem key={cat.id} value={cat.name} className="text-xs">
                                          {cat.icon} {cat.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t('import.wallet', 'Conta')}</Label>
                                  <Select
                                    value={tx.walletId || ''}
                                    onValueChange={(value) => updateTransaction(tx.id, { walletId: value })}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder={t('import.selectWallet', 'Selecionar...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {activeWallets.map((wallet) => (
                                        <SelectItem key={wallet.id} value={wallet.id} className="text-xs">
                                          {wallet.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {/* Credit Card selection */}
                            {tx.destinationType === 'credit_card' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t('import.category', 'Categoria')}</Label>
                                  <Select
                                    value={tx.category || ''}
                                    onValueChange={(value) => updateTransaction(tx.id, { category: value })}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder={t('import.selectCategory', 'Selecionar...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {expenseCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.name} className="text-xs">
                                          {cat.icon} {cat.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t('import.creditCard', 'Cartão')}</Label>
                                  <Select
                                    value={tx.creditCardId || ''}
                                    onValueChange={(value) => updateTransaction(tx.id, { creditCardId: value })}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder={t('import.selectCard', 'Selecionar...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {creditCards.map((card) => (
                                        <SelectItem key={card.id} value={card.id} className="text-xs">
                                          {card.name} ({card.bank})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {/* Invoice payment special case */}
                            {tx.isInvoicePayment && tx.destinationType === 'account' && (
                              <div className="bg-amber-500/10 rounded p-2 text-xs text-amber-700 dark:text-amber-400">
                                {tx.suggestedCardMatch && (
                                  <p className="mb-1">
                                    {t('import.suggestedCard', 'Sugestão: {{card}}', { card: tx.suggestedCardMatch })}
                                  </p>
                                )}
                                <p>{t('import.invoiceHint', 'Este parece ser um pagamento de fatura. Selecione o cartão abaixo para vincular:')}</p>
                                <Select
                                  value={tx.creditCardId || ''}
                                  onValueChange={(value) => linkInvoiceToCard(tx.id, value)}
                                >
                                  <SelectTrigger className="h-7 text-xs mt-2">
                                    <SelectValue placeholder={t('import.chooseCard', 'Escolher cartão...')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {creditCards.map((card) => (
                                      <SelectItem key={card.id} value={card.id} className="text-xs">
                                        {card.name} ({card.bank})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => { reset(); setPastedText(''); setParseError(null); }}>
                {t('import.back', 'Voltar')}
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
              >
                {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('import.import', 'Importar {{count}} transações', { count: selectedCount })}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};