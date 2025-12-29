import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CategoryGoal } from '@/hooks/useCategoryGoals';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Pencil, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface GoalCardProps {
  goal: CategoryGoal;
  onEdit: (goal: CategoryGoal) => void;
  onDelete: (id: string) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const spent = goal.spent || 0;
  const limit = goal.budget_limit;
  const percentage = Math.min((spent / limit) * 100, 100);
  const remaining = limit - spent;
  const isOverBudget = spent > limit;
  const isNearLimit = percentage >= 80 && !isOverBudget;

  // Map category to translation key
  const getCategoryTranslationKey = (cat: string): string => {
    const keyMap: Record<string, string> = {
      'Food': 'food',
      'Transport': 'transport',
      'Entertainment': 'entertainment',
      'Shopping': 'shopping',
      'Bills': 'bills',
      'Health': 'health',
      'Education': 'education',
      'Other': 'other_expense',
    };
    return keyMap[cat] || cat.toLowerCase().replace(/\s+/g, '_');
  };

  const getCategoryEmoji = (cat: string): string => {
    const emojiMap: Record<string, string> = {
      'Food': '🍔',
      'Transport': '🚗',
      'Entertainment': '🎮',
      'Shopping': '🛍️',
      'Bills': '📄',
      'Health': '💊',
      'Education': '📚',
      'Other': '📦',
    };
    return emojiMap[cat] || '📊';
  };

  return (
    <>
      <Card className={cn(
        "transition-all",
        isOverBudget && "border-destructive/50 bg-destructive/5",
        isNearLimit && "border-amber-500/50 bg-amber-500/5"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getCategoryEmoji(goal.category)}</span>
              <CardTitle className="text-base font-medium">
                {t(`transactions.categories.${getCategoryTranslationKey(goal.category)}`, goal.category)}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(goal)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('categoryGoals.spent')}</span>
            <span className={cn(
              "font-medium",
              isOverBudget && "text-destructive"
            )}>
              {formatCurrency(spent)} / {formatCurrency(limit)}
            </span>
          </div>
          
          <Progress 
            value={percentage} 
            className={cn(
              "h-2",
              isOverBudget && "[&>div]:bg-destructive",
              isNearLimit && "[&>div]:bg-amber-500"
            )}
          />
          
          <div className="flex items-center justify-between text-sm">
            {isOverBudget ? (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{t('categoryGoals.overBudget', { amount: formatCurrency(Math.abs(remaining)) })}</span>
              </div>
            ) : isNearLimit ? (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{t('categoryGoals.nearLimit')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-income" />
                <span>{t('categoryGoals.remaining', { amount: formatCurrency(remaining) })}</span>
              </div>
            )}
            <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categoryGoals.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('categoryGoals.deleteConfirmDesc', { 
                category: t(`transactions.categories.${getCategoryTranslationKey(goal.category)}`, goal.category) 
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(goal.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
