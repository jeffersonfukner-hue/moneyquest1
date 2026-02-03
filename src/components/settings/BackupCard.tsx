import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Database, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBackup } from '@/hooks/useBackup';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const IMPORT_STEPS: Record<string, string> = {
  reading: 'Lendo arquivo...',
  categories: 'Importando categorias...',
  wallets: 'Importando carteiras...',
  suppliers: 'Importando fornecedores...',
  creditCards: 'Importando cartões...',
  invoices: 'Importando faturas...',
  categoryGoals: 'Importando metas...',
  transactions: 'Importando transações...',
  templates: 'Importando templates...',
  transfers: 'Importando transferências...',
  scheduled: 'Importando agendamentos...',
  loans: 'Importando empréstimos...',
  rewards: 'Importando recompensas...',
};

export const BackupCard = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const {
    isExporting,
    isImporting,
    importProgress,
    exportBackup,
    importBackup,
    getLastBackupDate,
  } = useBackup();

  const lastBackupDate = getLastBackupDate();

  const handleExport = async () => {
    await exportBackup();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowConfirmDialog(true);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (selectedFile) {
      const success = await importBackup(selectedFile);
      if (success) {
        // Reload the page to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
    setShowConfirmDialog(false);
    setSelectedFile(null);
  };

  const handleImportCancel = () => {
    setShowConfirmDialog(false);
    setSelectedFile(null);
  };

  const progressPercent = importProgress 
    ? Math.round((importProgress.current / importProgress.total) * 100)
    : 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-5 h-5 text-primary" />
            {t('backup.title')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('backup.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress indicator during import */}
          {isImporting && importProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {IMPORT_STEPS[importProgress.step] || importProgress.step}
                </span>
                <span className="font-mono text-xs">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleExport}
              disabled={isExporting || isImporting}
              className="flex-1 min-h-[44px]"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? t('backup.exporting') : t('backup.export')}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExporting || isImporting}
              className="flex-1 min-h-[44px]"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isImporting ? t('backup.importing') : t('backup.import')}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Last backup info */}
          {lastBackupDate && (
            <p className="text-xs text-muted-foreground text-center">
              {t('backup.lastBackup')}: {format(lastBackupDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('backup.confirmImport')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('backup.confirmImportDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleImportCancel}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              {t('backup.import')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
