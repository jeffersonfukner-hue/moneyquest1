import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Zap, X, Coffee, Utensils, Bus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionTemplates, TransactionTemplate } from '@/hooks/useTransactionTemplates';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AddTemplateDialog } from './AddTemplateDialog';
import { LevelLockedFeature } from './LevelLockedFeature';
import { cn } from '@/lib/utils';

interface QuickTemplatesProps {
  onUseTemplate: (template: TransactionTemplate) => void;
}

// Default quick action icons
const QUICK_ICONS: Record<string, React.ReactNode> = {
  'Coffee': <Coffee className="w-4 h-4" />,
  'Lunch': <Utensils className="w-4 h-4" />,
  'Transport': <Bus className="w-4 h-4" />,
  'Shopping': <ShoppingBag className="w-4 h-4" />,
};

export const QuickTemplates = ({ onUseTemplate }: QuickTemplatesProps) => {
  const { t } = useTranslation();
  const { formatConverted } = useCurrency();
  const { templates, deleteTemplate, loading } = useTransactionTemplates();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  if (loading) {
    return null;
  }

  // Show compact version when no templates exist
  if (templates.length === 0) {
    return (
      <>
        <Card className="bg-card/50 border-dashed border-muted-foreground/30">
          <CardContent className="py-4">
            <button
              onClick={() => setShowAddDialog(true)}
              className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">{t('templates.createFirst')}</span>
            </button>
          </CardContent>
        </Card>
        <AddTemplateDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </>
    );
  }

  return (
    <LevelLockedFeature featureKey="transaction_templates">
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            {t('templates.quickAdd')}
          </CardTitle>
          <div className="flex gap-1">
            {templates.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setDeleteMode(!deleteMode)}
              >
                {deleteMode ? t('common.done') : t('common.edit')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => deleteMode ? deleteTemplate(template.id) : onUseTemplate(template)}
                className={cn(
                  "flex-shrink-0 relative group",
                  "px-3 py-2 rounded-xl border transition-all",
                  "flex flex-col items-center gap-1 min-w-[70px]",
                  deleteMode
                    ? "border-destructive/50 bg-destructive/10 hover:bg-destructive/20"
                    : template.type === 'EXPENSE'
                      ? "border-expense/30 bg-expense/10 hover:bg-expense/20"
                      : "border-income/30 bg-income/10 hover:bg-income/20"
                )}
              >
                {deleteMode && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </div>
                )}
                <span className="text-lg">{template.icon}</span>
                <span className="text-xs font-medium truncate max-w-[60px]">
                  {template.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatConverted(template.amount, template.currency)}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <AddTemplateDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </LevelLockedFeature>
  );
};
