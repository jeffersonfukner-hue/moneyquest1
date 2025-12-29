import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  MoreHorizontal, 
  Crown, 
  Ban, 
  Gift, 
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/types/admin';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';

interface UsersTableProps {
  users: AdminUser[];
  onGrantPremium: (user: AdminUser) => void;
  onRevokePremium: (user: AdminUser) => void;
  onBlockUser: (user: AdminUser) => void;
  onUnblockUser: (user: AdminUser) => void;
  onSendMessage: (user: AdminUser) => void;
  onGrantBonus: (user: AdminUser) => void;
}

export const UsersTable = ({
  users,
  onGrantPremium,
  onRevokePremium,
  onBlockUser,
  onUnblockUser,
  onSendMessage,
  onGrantBonus,
}: UsersTableProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> {t('admin.status.active')}</Badge>;
      case 'blocked':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> {t('admin.status.blocked')}</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> {t('admin.status.inactive')}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    if (plan === 'PREMIUM') {
      return <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white"><Crown className="w-3 h-3 mr-1" /> Premium</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder={t('admin.searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t('admin.table.user')}</TableHead>
              <TableHead>{t('admin.table.status')}</TableHead>
              <TableHead>{t('admin.table.plan')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('admin.table.lastActive')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('admin.table.registered')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <AvatarDisplay
                      avatarUrl={(user as any).avatar_url}
                      avatarIcon={user.avatar_icon}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{user.display_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                <TableCell>{getPlanBadge(user.subscription_plan)}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {user.last_active_date 
                    ? format(new Date(user.last_active_date), 'dd/MM/yyyy')
                    : '-'
                  }
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {format(new Date(user.created_at), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.subscription_plan === 'FREE' ? (
                        <DropdownMenuItem onClick={() => onGrantPremium(user)}>
                          <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                          {t('admin.actions.grantPremium')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onRevokePremium(user)}>
                          <Crown className="w-4 h-4 mr-2 text-muted-foreground" />
                          {t('admin.actions.revokePremium')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onGrantBonus(user)}>
                        <Gift className="w-4 h-4 mr-2 text-primary" />
                        {t('admin.actions.grantBonus')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSendMessage(user)}>
                        <Mail className="w-4 h-4 mr-2 text-blue-500" />
                        {t('admin.actions.sendMessage')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === 'blocked' ? (
                        <DropdownMenuItem onClick={() => onUnblockUser(user)}>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          {t('admin.actions.unblock')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => onBlockUser(user)}
                          className="text-red-600"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          {t('admin.actions.block')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t('admin.noUsersFound')}
        </div>
      )}
    </div>
  );
};
