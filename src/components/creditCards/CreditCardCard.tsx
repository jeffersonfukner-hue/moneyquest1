import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard as CreditCardIcon, MoreVertical, Edit, Trash2, Calendar, Building2, Wallet as WalletIcon, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { CreditCard } from '@/hooks/useCreditCards';
import { Wallet } from '@/types/wallet';
import { formatMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface CreditCardCardProps {
  card: CreditCard;
  wallets: Wallet[];
  onEdit: (card: CreditCard) => void;
  onDelete: (id: string) => void;
  onViewInvoices: (card: CreditCard) => void;
}

export const CreditCardCard = ({ card, wallets, onEdit, onDelete, onViewInvoices }: CreditCardCardProps) => {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const usedLimit = card.total_limit - card.available_limit;
  const usedPercentage = card.total_limit > 0 ? (usedLimit / card.total_limit) * 100 : 0;
  const linkedWallet = wallets.find(w => w.id === card.linked_wallet_id);

  const getUsageColor = () => {
    if (usedPercentage >= 90) return 'bg-destructive';
    if (usedPercentage >= 70) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <>
      <Card className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        !card.is_active && "opacity-60"
      )}>
        {/* Gradient header */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
        
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <CreditCardIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{card.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {card.bank}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(card)}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('common.edit', 'Editar')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('common.delete', 'Excluir')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Limit Usage */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('creditCards.used', 'Usado')}</span>
              <span className="font-medium">
                {formatMoney(usedLimit, card.currency as any)} / {formatMoney(card.total_limit, card.currency as any)}
              </span>
            </div>
            <Progress value={usedPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('creditCards.available', 'Disponível')}: {formatMoney(card.available_limit, card.currency as any)}</span>
              <span>{usedPercentage.toFixed(0)}%</span>
            </div>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {t('creditCards.closes', 'Fecha')}: {card.billing_close_day}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {t('creditCards.due', 'Vence')}: {card.due_day}
            </Badge>
          </div>

          {/* View Invoices Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 mt-2"
            onClick={() => onViewInvoices(card)}
          >
            <Receipt className="w-4 h-4" />
            {t('creditCards.viewInvoices', 'Ver Faturas')}
          </Button>

          {/* Linked wallet */}
          {linkedWallet && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <WalletIcon className="w-3 h-3" />
                {t('creditCards.paysFrom', 'Paga via')}: 
                <span className="font-medium text-foreground">{linkedWallet.icon} {linkedWallet.name}</span>
              </p>
            </div>
          )}

          {!card.is_active && (
            <Badge variant="secondary" className="mt-2">
              {t('creditCards.inactive', 'Inativo')}
            </Badge>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('creditCards.deleteTitle', 'Excluir cartão?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('creditCards.deleteDesc', 'Esta ação não pode ser desfeita. Todas as transações vinculadas a este cartão permanecerão no histórico.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(card.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('common.delete', 'Excluir')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
