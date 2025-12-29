import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { Category, TransactionType } from '@/types/database';
import { AddCategoryDialog } from '@/components/categories/AddCategoryDialog';
import { EditCategoryDialog } from '@/components/categories/EditCategoryDialog';
import { DeleteCategoryDialog } from '@/components/categories/DeleteCategoryDialog';
import { Navigate } from 'react-router-dom';

const Categories = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { categories, loading, getCategoriesByType, deleteCategory, updateCategory, addCategory } = useCategories();
  
  const [activeTab, setActiveTab] = useState<TransactionType>('EXPENSE');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<Category | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const expenseCategories = getCategoriesByType('EXPENSE');
  const incomeCategories = getCategoriesByType('INCOME');

  const handleDelete = async () => {
    if (deleteConfirmCategory) {
      await deleteCategory(deleteConfirmCategory.id);
      setDeleteConfirmCategory(null);
    }
  };

  const handleEdit = async (updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => {
    if (editCategory) {
      await updateCategory(editCategory.id, updates);
      setEditCategory(null);
    }
  };

  const handleAdd = async (name: string, type: TransactionType, icon: string, color: string) => {
    await addCategory(name, type, icon, color);
    setAddDialogOpen(false);
  };

  const CategoryCard = ({ category }: { category: Category }) => (
    <div 
      className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors"
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>
        <div>
          <p className="font-medium text-foreground">{category.name}</p>
          {category.is_default && (
            <span className="text-xs text-muted-foreground">{t('categories.defaultCategory')}</span>
          )}
        </div>
      </div>
      
      {!category.is_default && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditCategory(category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirmCategory(category)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold">{t('categories.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('categories.pageDescription')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransactionType)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="EXPENSE">{t('categories.expense')}</TabsTrigger>
          <TabsTrigger value="INCOME">{t('categories.income')}</TabsTrigger>
        </TabsList>

        <TabsContent value="EXPENSE" className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
          ) : expenseCategories.length === 0 ? (
            <Card className="bg-card/50">
              <CardContent className="py-8 text-center">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('categories.noCategories')}</p>
              </CardContent>
            </Card>
          ) : (
            expenseCategories.map(cat => <CategoryCard key={cat.id} category={cat} />)
          )}
        </TabsContent>

        <TabsContent value="INCOME" className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
          ) : incomeCategories.length === 0 ? (
            <Card className="bg-card/50">
              <CardContent className="py-8 text-center">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('categories.noCategories')}</p>
              </CardContent>
            </Card>
          ) : (
            incomeCategories.map(cat => <CategoryCard key={cat.id} category={cat} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Add Button */}
      <Button
        size="lg"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-hero hover:opacity-90"
        onClick={() => setAddDialogOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Dialogs */}
      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
        defaultType={activeTab}
      />

      <EditCategoryDialog
        category={editCategory}
        onClose={() => setEditCategory(null)}
        onSave={handleEdit}
      />

      <DeleteCategoryDialog
        category={deleteConfirmCategory}
        onClose={() => setDeleteConfirmCategory(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Categories;
