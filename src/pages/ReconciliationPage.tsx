import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Scale, ArrowLeft, RefreshCw, 
  Filter, BarChart3, Loader2
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
import { useWallets } from '@/hooks/useWallets';
import { useReconciliation } from '@/hooks/useReconciliation';
import { ReconciliationTable } from '@/components/reconciliation/ReconciliationTable';
import { ReconciliationConsolidated } from '@/components/reconciliation/ReconciliationConsolidated';
import { CSVImportWizard } from '@/components/import/CSVImportWizard';
import { ParsedBankLine } from '@/lib/csvParser';
import { APP_ROUTES } from '@/routes/routes';

export default function ReconciliationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { walletId } = useParams<{ walletId?: string }>();
  
  const { activeWallets } = useWallets();
  const [selectedWalletId, setSelectedWalletId] = useState<string>(walletId || '');
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [existingFingerprints, setExistingFingerprints] = useState<Set<string>>(new Set());

  // Filter to only bank accounts (not cash)
  const bankAccounts = activeWallets.filter(w => w.type !== 'cash');

  const {
    bankLines,
    loading,
    importing,
    stats,
    importBankLines,
    getExistingFingerprints,
    reconcileWithTransaction,
    createTransactionFromLine,
    ignoreBankLine,
    undoReconciliation,
    refetch,
  } = useReconciliation(selectedWalletId || undefined);

  const selectedWallet = bankAccounts.find(w => w.id === selectedWalletId);

  // Handle opening import wizard - fetch fingerprints first
  const handleOpenImportWizard = useCallback(async () => {
    if (!selectedWalletId) return;
    
    const fingerprints = await getExistingFingerprints(selectedWalletId);
    setExistingFingerprints(fingerprints);
    setImportWizardOpen(true);
  }, [selectedWalletId, getExistingFingerprints]);

  // Handle import from wizard
  const handleImportFromWizard = async (lines: ParsedBankLine[]): Promise<boolean> => {
    if (!selectedWalletId) return false;

    const importLines = lines.map(line => ({
      transaction_date: line.date,
      description: line.description,
      amount: line.amount,
      bank_reference: line.bankReference,
      counterparty: line.counterparty,
      fingerprint: line.fingerprint,
    }));

    return importBankLines({
      walletId: selectedWalletId,
      lines: importLines,
      sourceFileName: 'csv-import',
    });
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
                    onClick={handleOpenImportWizard}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t('reconciliation.importStatement', 'Importar Extrato')}
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

            {/* Stats */}
            {selectedWalletId && bankLines.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">{t('reconciliation.stats.total', 'Total')}</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">{t('reconciliation.stats.pending', 'Pendentes')}</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">{t('reconciliation.stats.reconciled', 'Conciliados')}</p>
                    <p className="text-2xl font-bold text-green-600">{stats.reconciled + stats.created}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">{t('reconciliation.stats.ignored', 'Ignorados')}</p>
                    <p className="text-2xl font-bold text-muted-foreground">{stats.ignored}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">{t('reconciliation.stats.progress', 'Progresso')}</p>
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
                  <p className="font-medium">{t('reconciliation.selectAccount', 'Selecione uma conta bancária')}</p>
                  <p className="text-sm mt-1">
                    {t('reconciliation.selectAccountHint', 'Escolha uma conta para iniciar a conciliação')}
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

        {/* CSV Import Wizard */}
        <CSVImportWizard
          open={importWizardOpen}
          onOpenChange={setImportWizardOpen}
          walletName={selectedWallet?.name || ''}
          existingFingerprints={existingFingerprints}
          onImport={handleImportFromWizard}
        />
      </div>
    </AppShell>
  );
}
