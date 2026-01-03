import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Download, Loader2, CheckCircle2, CloudUpload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName,
  onConfirm,
  isLoading,
}: DeleteUserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupComplete, setBackupComplete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const emailMatches = confirmEmail === userEmail;

  useEffect(() => {
    if (!open) {
      setConfirmEmail("");
      setBackupComplete(false);
      setIsDeleting(false);
    }
  }, [open]);

  const exportUserData = async () => {
    const { data, error } = await supabase.rpc('admin_export_user_data', {
      _target_user_id: userId
    });

    if (error) throw error;
    return data;
  };

  const saveBackupToStorage = async (data: unknown) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `user-backup-${userEmail.replace('@', '_at_')}-${timestamp}.json`;
    const filePath = `deleted-users/${filename}`;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    const { error } = await supabase.storage
      .from('admin-backups')
      .upload(filePath, blob, {
        contentType: 'application/json',
        upsert: false
      });

    if (error) throw error;
    return filePath;
  };

  const handleExportDownload = async () => {
    if (!userId) return;
    
    setIsExporting(true);
    try {
      const data = await exportUserData();

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${userEmail.replace('@', '_at_')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t("admin.delete.exportSuccess"),
        description: t("admin.delete.exportSuccessDesc"),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t("admin.delete.exportError"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!emailMatches || !userId) return;

    setIsDeleting(true);

    try {
      // Auto backup if enabled
      if (autoBackup) {
        toast({
          title: t("admin.delete.backupInProgress"),
          description: t("admin.delete.backupInProgressDesc"),
        });

        const data = await exportUserData();
        await saveBackupToStorage(data);
        
        setBackupComplete(true);
        
        toast({
          title: t("admin.delete.backupSuccess"),
          description: t("admin.delete.backupSuccessDesc"),
        });
      }

      // Proceed with deletion
      onConfirm();
    } catch (error) {
      console.error('Backup/Delete error:', error);
      toast({
        title: t("admin.delete.backupError"),
        description: String(error),
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  const isPending = isLoading || isDeleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-destructive">
              {t("admin.delete.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {t("admin.delete.warning")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md bg-destructive/10 p-3 text-sm">
            <p className="text-destructive">
              {t("admin.delete.permanentWarning")}
            </p>
            <p className="mt-2 font-medium">
              {t("admin.delete.userInfo")}: <strong>{userName}</strong> (
              <span className="font-mono text-xs">{userEmail}</span>)
            </p>
          </div>

          {/* Auto backup option */}
          <div className="rounded-md border border-border bg-muted/50 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudUpload className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="auto-backup" className="text-sm font-medium cursor-pointer">
                  {t("admin.delete.autoBackup")}
                </Label>
              </div>
              <Switch
                id="auto-backup"
                checked={autoBackup}
                onCheckedChange={setAutoBackup}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.delete.autoBackupHint")}
            </p>
            
            {backupComplete && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {t("admin.delete.backupComplete")}
              </div>
            )}
          </div>

          {/* Manual export button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDownload}
              disabled={isExporting || isPending}
              className="flex-1"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {t("admin.delete.exportButton")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              {t("admin.delete.confirmLabel")}
            </Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder={userEmail}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={isPending}
              className={
                confirmEmail && !emailMatches
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {confirmEmail && !emailMatches && (
              <p className="text-xs text-destructive">
                {t("admin.delete.emailMismatch")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={!emailMatches || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {autoBackup && !backupComplete 
                  ? t("admin.delete.backingUp") 
                  : t("common.loading")}
              </>
            ) : (
              t("admin.delete.confirmButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
