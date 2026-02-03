import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Search, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  TrendingUp,
  Calendar,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseDateString } from '@/lib/dateUtils';
import { toast } from 'sonner';
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

const Suppliers = () => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { suppliers, loading, updateSupplier, deleteSupplier } = useSuppliers();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setEditingName(supplier.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) {
      toast.error(t('suppliers.emptyName'));
      return;
    }

    const result = await updateSupplier(id, editingName);
    
    if (result.error) {
      toast.error(t('suppliers.updateError'));
    } else {
      toast.success(t('suppliers.updateSuccess'));
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;

    const result = await deleteSupplier(supplierToDelete.id);
    
    if (result.error) {
      toast.error(t('suppliers.deleteError'));
    } else {
      toast.success(t('suppliers.deleteSuccess'));
    }
    
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  // Calculate stats
  const totalSuppliers = suppliers.length;
  const totalSpent = suppliers.reduce((sum, s) => sum + s.total_spent, 0);
  const totalTransactions = suppliers.reduce((sum, s) => sum + s.usage_count, 0);

  return (
    <AppShell>
      <div className="space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('suppliers.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('suppliers.subtitle')}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <Hash className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{totalSuppliers}</p>
            <p className="text-[10px] text-muted-foreground">{t('suppliers.stats.total')}</p>
          </Card>
          <Card className="p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-expense mb-1" />
            <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
            <p className="text-[10px] text-muted-foreground">{t('suppliers.stats.spent')}</p>
          </Card>
          <Card className="p-3 text-center">
            <Calendar className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{totalTransactions}</p>
            <p className="text-[10px] text-muted-foreground">{t('suppliers.stats.transactions')}</p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('suppliers.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <Card className="p-8 text-center">
            <Store className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? t('suppliers.noResults') : t('suppliers.empty')}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === supplier.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(supplier.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-income"
                          onClick={() => handleSaveEdit(supplier.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-sm truncate">{supplier.name}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {supplier.usage_count} {supplier.usage_count === 1 ? t('suppliers.use') : t('suppliers.uses')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatCurrency(supplier.total_spent)}
                          </span>
                          {supplier.last_used_at && (
                            <span className="text-[10px] text-muted-foreground">
                              • {format(parseDateString(supplier.last_used_at.split('T')[0]), 'd MMM', { locale: dateLocale })}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {editingId !== supplier.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(supplier)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteClick(supplier)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('suppliers.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('suppliers.deleteDescription', { name: supplierToDelete?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
};

export default Suppliers;
