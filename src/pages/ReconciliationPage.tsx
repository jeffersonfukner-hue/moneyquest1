import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Scale, ArrowLeft, RefreshCw, 
  Trash2, Filter, BarChart3, Loader2
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWallets } from '@/hooks/useWallets';
import { useReconciliation } from '@/hooks/useReconciliation';
import { useBankStatementImport } from '@/hooks/useBankStatementImport';
import { ReconciliationTable } from '@/components/reconciliation/ReconciliationTable';
import { ReconciliationConsolidated } from '@/components/reconciliation/ReconciliationConsolidated';
import { APP_ROUTES } from '@/routes/routes';
import { cn } from '@/lib/utils';

export default function ReconciliationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { walletId } = useParams<{ walletId?: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { activeWallets } = useWallets();
  const [selectedWalletId, setSelectedWalletId] = useState<string>(walletId || '');
  const [pastedText, setPastedText] = useState('');
  const [importTab, setImportTab] = useState<'file' | 'paste'>('file');
  const [showImportPanel, setShowImportPanel] = useState(false);

  // Filter to only bank accounts (not cash)
  const bankAccounts = activeWallets.filter(w => w.type !== 'cash');

  const {
    bankLines,
    loading,
    importing,
    stats,
    importBankLines,
    reconcileWithTransaction,
    createTransactionFromLine,
    ignoreBankLine,
    undoReconciliation,
    refetch,
  } = useReconciliation(selectedWalletId || undefined);

  const {
    loading: parsingLoading,
    transactions: parsedTransactions,
    parseFile,
    parseText,
    reset: resetParser,
  } = useBankStatementImport();

  const selectedWallet = bankAccounts.find(w => w.id === selectedWalletId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedWalletId) return;

    await parseFile(file);
  };

  const handlePasteImport = async () => {
    if (!pastedText.trim() || !selectedWalletId) return;
    await parseText(pastedText);
  };

  const handleConfirmImport = async () => {
    if (!selectedWalletId || parsedTransactions.length === 0) return;

    const lines = parsedTransactions.map(tx => ({
      transaction_date: tx.date,
      description: tx.description,
      amount: tx.type === 'INCOME' ? tx.amount : -tx.amount,
    }));

    const success = await importBankLines({
      walletId: selectedWalletId,
      lines,
      sourceFileName: 'import',
    });

    if (success) {
      resetParser();
      setPastedText('');
      setShowImportPanel(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(APP_ROUTES.WALLETS_ACCOUNTS)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Scale className="w-6 h-6" />
                {t('reconciliation.title', 'Conciliação Bancária')}
              </h1>
              <p className="text-muted-foreground">
                {t('reconciliation.subtitle', 'Compare o extrato do banco com suas transações')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs: Conta / Consolidado */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account" className="gap-2">
              <FileText className="w-4 h-4" />
              Conciliação da Conta
            </TabsTrigger>
            <TabsTrigger value="consolidated" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Consolidado Geral
            </TabsTrigger>
          </TabsList>

          {/* Account Reconciliation Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Wallet Selector */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 max-w-xs">
                <Select 
                  value={selectedWalletId} 
                  onValueChange={setSelectedWalletId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta bancária" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(wallet => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.institution || wallet.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedWalletId && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowImportPanel(!showImportPanel)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Extrato
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={refetch}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Import Panel */}
            {showImportPanel && selectedWalletId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Importar Extrato</CardTitle>
                  <CardDescription>
                    Importe um arquivo CSV/TXT ou cole o texto do extrato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {parsedTransactions.length === 0 ? (
                    <Tabs value={importTab} onValueChange={(v) => setImportTab(v as 'file' | 'paste')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file">Arquivo</TabsTrigger>
                        <TabsTrigger value="paste">Colar Texto</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="file" className="mt-4">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                            "hover:border-primary hover:bg-primary/5",
                            parsingLoading && "opacity-50 pointer-events-none"
                          )}
                        >
                          {parsingLoading ? (
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                          ) : (
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          )}
                          <p className="text-sm font-medium">
                            {parsingLoading ? 'Processando...' : 'Clique ou arraste o arquivo'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            CSV, TXT ou OFX
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.txt,.ofx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </TabsContent>

                      <TabsContent value="paste" className="mt-4 space-y-3">
                        <Textarea
                          placeholder="Cole o extrato aqui..."
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          className="min-h-[150px] font-mono text-sm"
                        />
                        <Button 
                          onClick={handlePasteImport}
                          disabled={!pastedText.trim() || parsingLoading}
                          className="w-full"
                        >
                          {parsingLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Processar
                        </Button>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="font-medium mb-2">
                          {parsedTransactions.length} lançamento(s) encontrado(s)
                        </p>
                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                          {parsedTransactions.slice(0, 10).map((tx, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="truncate">{tx.date} - {tx.description}</span>
                              <span className={tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {parsedTransactions.length > 10 && (
                            <p className="text-xs text-muted-foreground">
                              ... e mais {parsedTransactions.length - 10} lançamento(s)
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={resetParser} className="flex-1">
                          Cancelar
                        </Button>
                        <Button onClick={handleConfirmImport} disabled={importing} className="flex-1">
                          {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Importar para Conciliação
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            {selectedWalletId && bankLines.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Conciliados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.reconciled + stats.created}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Ignorados</p>
                    <p className="text-2xl font-bold text-muted-foreground">{stats.ignored}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Progresso</p>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.percentReconciled} className="flex-1" />
                      <span className="text-sm font-medium">{stats.percentReconciled}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reconciliation Table */}
            {selectedWalletId ? (
              loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ReconciliationTable
                  bankLines={bankLines}
                  walletId={selectedWalletId}
                  onReconcile={reconcileWithTransaction}
                  onCreateTransaction={createTransactionFromLine}
                  onIgnore={ignoreBankLine}
                  onUndo={undoReconciliation}
                />
              )
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Selecione uma conta bancária</p>
                  <p className="text-sm mt-1">
                    Escolha uma conta para iniciar a conciliação
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Consolidated Tab */}
          <TabsContent value="consolidated">
            <ReconciliationConsolidated />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
