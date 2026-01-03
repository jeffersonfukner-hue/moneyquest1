import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UsersTable } from '@/components/admin/UsersTable';
import { PremiumDialog } from '@/components/admin/PremiumDialog';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import { useAdminData } from '@/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { AdminUser } from '@/types/admin';

const UsersManagement = () => {
  const { t } = useTranslation();
  const { users, usersLoading, updateSubscription, updateUserStatus, grantBonus, sendMessage, resetPremiumOverride, deleteUser } = useAdminData();
  
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [resetOverrideOpen, setResetOverrideOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleGrantPremium = (user: AdminUser) => {
    setSelectedUser(user);
    setPremiumOpen(true);
  };

  const handleRevokePremium = (user: AdminUser) => {
    updateSubscription.mutate({ targetUserId: user.id, plan: 'FREE', note: 'Premium revoked by admin' });
  };

  const handleBlockUser = (user: AdminUser) => {
    setSelectedUser(user);
    setBlockOpen(true);
  };

  const handleConfirmBlock = () => {
    if (selectedUser) {
      updateUserStatus.mutate({ targetUserId: selectedUser.id, status: 'blocked', note: 'Blocked by admin' });
    }
    setBlockOpen(false);
  };

  const handleUnblockUser = (user: AdminUser) => {
    updateUserStatus.mutate({ targetUserId: user.id, status: 'active', note: 'Unblocked by admin' });
  };

  const handleSendMessage = (user: AdminUser) => {
    sendMessage.mutate({ targetUserId: user.id, title: 'Welcome!', content: 'Thank you for using our app!' });
  };

  const handleGrantBonus = (user: AdminUser) => {
    grantBonus.mutate({ targetUserId: user.id, bonusType: 'XP', amount: 100, note: 'Bonus from admin' });
  };

  const handleResetOverride = (user: AdminUser) => {
    setSelectedUser(user);
    setResetOverrideOpen(true);
  };

  const handleConfirmResetOverride = () => {
    if (selectedUser) {
      resetPremiumOverride.mutate({ targetUserId: selectedUser.id, note: 'Override reset by admin' });
    }
    setResetOverrideOpen(false);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUser.mutate({ targetUserId: selectedUser.id, note: 'User deleted by admin' });
    }
    setDeleteOpen(false);
  };

  const handlePremiumConfirm = (userId: string, expiresAt: string | null, note: string) => {
    updateSubscription.mutate({ targetUserId: userId, plan: 'PREMIUM', expiresAt, note });
    setPremiumOpen(false);
  };

  if (usersLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{t('admin.users.title')}</h1>
          <p className="text-muted-foreground">{t('admin.users.subtitle')}</p>
        </div>

        <UsersTable
          users={users || []}
          onGrantPremium={handleGrantPremium}
          onRevokePremium={handleRevokePremium}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          onSendMessage={handleSendMessage}
          onGrantBonus={handleGrantBonus}
          onResetOverride={handleResetOverride}
          onDeleteUser={handleDeleteUser}
        />
      </div>

      <PremiumDialog
        open={premiumOpen}
        onOpenChange={setPremiumOpen}
        user={selectedUser}
        onConfirm={handlePremiumConfirm}
      />

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.block.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.block.description', { user: selectedUser?.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBlock} className="bg-destructive text-destructive-foreground">
              {t('admin.block.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOverrideOpen} onOpenChange={setResetOverrideOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.override.resetTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.override.resetDescription', { user: selectedUser?.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResetOverride}>
              {t('admin.override.resetConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        userId={selectedUser?.id || ''}
        userEmail={selectedUser?.email || ''}
        userName={selectedUser?.display_name || selectedUser?.email || ''}
        onConfirm={handleConfirmDelete}
        isLoading={deleteUser.isPending}
      />
    </AdminLayout>
  );
};

export default UsersManagement;
