import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Database, Loader2, Save, Trash2, RotateCcw, Cloud } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const BackupCard = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  
  const {
    isExporting,
    isImporting,
    isSaving,
    isLoadingBackups,
    isDeletingBackup,
    importProgress,
    savedBackups,
    exportBackup,
    importBackup,
    saveBackupToSystem,
    restoreFromSavedBackup,
    deleteBackup,
    getLastBackupDate,
  } = useBackup();

  const lastBackupDate = getLastBackupDate();

  const handleExport = async () => {
    await exportBackup();
  };

  const handleSaveToSystem = async () => {
    await saveBackupToSystem();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowConfirmDialog(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (selectedFile) {
      const success = await importBackup(selectedFile);
      if (success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
    setShowConfirmDialog(false);
    setSelectedFile(null);
  };

  const handleRestoreClick = (backupId: string) => {
    setSelectedBackupId(backupId);
    setShowRestoreDialog(true);
  };

  const handleRestoreConfirm = async () => {
    if (selectedBackupId) {
      const success = await restoreFromSavedBackup(selectedBackupId);
      if (success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
    setShowRestoreDialog(false);
    setSelectedBackupId(null);
  };

  const handleDeleteClick = (backupId: string) => {
    setSelectedBackupId(backupId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedBackupId) {
      deleteBackup(selectedBackupId);
    }
    setShowDeleteDialog(false);
    setSelectedBackupId(null);
  };

  const handleDialogCancel = () => {
    setShowConfirmDialog(false);
    setShowRestoreDialog(false);
    setShowDeleteDialog(false);
    setSelectedFile(null);
    setSelectedBackupId(null);
  };

  const progressPercent = importProgress 
    ? Math.round((importProgress.current / importProgress.total) * 100)
    : 0;

  const isLoading = isExporting || isImporting || isSaving;

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

          {/* Save to System Button */}
          <Button
            onClick={handleSaveToSystem}
            disabled={isLoading}
            className="w-full min-h-[44px]"
            variant="default"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 mr-2" />
            )}
            {isSaving ? t('backup.saving') : t('backup.saveToSystem')}
          </Button>

          {/* Saved Backups List */}
          {isLoadingBackups ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : savedBackups.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                {t('backup.savedBackups')}
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {savedBackups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{backup.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(backup.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {formatFileSize(backup.file_size)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleRestoreClick(backup.id)}
                        disabled={isLoading}
                        title={t('backup.restore')}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(backup.id)}
                        disabled={isLoading || isDeletingBackup}
                        title={t('backup.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Export/Import Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleExport}
              disabled={isLoading}
              variant="outline"
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
              disabled={isLoading}
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

      {/* Import from File Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('backup.confirmImport')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('backup.confirmImportDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogCancel}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              {t('backup.import')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore from Saved Backup Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('backup.confirmRestore')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('backup.confirmRestoreDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogCancel}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm}>
              {t('backup.restore')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Backup Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('backup.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('backup.confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogCancel}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('backup.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
