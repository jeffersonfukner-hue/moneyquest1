import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
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

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userEmail,
  userName,
  onConfirm,
  isLoading,
}: DeleteUserDialogProps) {
  const { t } = useTranslation();
  const [confirmEmail, setConfirmEmail] = useState("");

  const emailMatches = confirmEmail === userEmail;

  useEffect(() => {
    if (!open) {
      setConfirmEmail("");
    }
  }, [open]);

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
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!emailMatches || isLoading}
          >
            {isLoading ? t("common.loading") : t("admin.delete.confirmButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
