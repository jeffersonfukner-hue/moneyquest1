import { useState } from 'react';
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
  Search,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Trash2
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/types/admin';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';

// Labels fixos em pt-BR para SuperAdmin
const LABELS = {
  searchUsers: 'Buscar usuários...',
  noUsersFound: 'Nenhum usuário encontrado',
  table: {
    user: 'Usuário',
    status: 'Status',
    plan: 'Plano',
    lastActive: 'Último Acesso',
    registered: 'Cadastro',
  },
  status: {
    active: 'Ativo',
    blocked: 'Bloqueado',
    inactive: 'Inativo',
  },
  actions: {
    grantPremium: 'Conceder Premium',
    revokePremium: 'Revogar Premium',
    resetOverride: 'Resetar Override',
    grantBonus: 'Conceder Bônus',
    sendMessage: 'Enviar Mensagem',
    block: 'Bloquear',
    unblock: 'Desbloquear',
    deleteUser: 'Excluir Usuário',
  },
  override: {
    forceOn: 'Premium forçado (override admin)',
    forceOff: 'Premium desativado (override admin)',
  },
  noName: 'Sem nome',
};

interface UsersTableProps {
  users: AdminUser[];
  onGrantPremium: (user: AdminUser) => void;
  onRevokePremium: (user: AdminUser) => void;
  onBlockUser: (user: AdminUser) => void;
  onUnblockUser: (user: AdminUser) => void;
  onSendMessage: (user: AdminUser) => void;
  onGrantBonus: (user: AdminUser) => void;
  onResetOverride: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
}

export const UsersTable = ({
  users,
  onGrantPremium,
  onRevokePremium,
  onBlockUser,
  onUnblockUser,
  onSendMessage,
  onGrantBonus,
  onResetOverride,
  onDeleteUser,
}: UsersTableProps) => {
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> {LABELS.status.active}</Badge>;
      case 'blocked':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> {LABELS.status.blocked}</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> {LABELS.status.inactive}</Badge>;
    }
  };

  const getPlanBadge = (user: AdminUser) => {
    const hasOverride = user.premium_override !== 'none';
    
    if (user.subscription_plan === 'PREMIUM') {
      return (
        <div className="flex items-center gap-1.5">
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
            <Crown className="w-3 h-3 mr-1" /> Premium
          </Badge>
          {hasOverride && user.premium_override === 'force_on' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 px-1.5">
                    <ShieldCheck className="w-3 h-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{LABELS.override.forceOn}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="secondary">Free</Badge>
        {hasOverride && user.premium_override === 'force_off' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 px-1.5">
                  <ShieldAlert className="w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{LABELS.override.forceOff}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder={LABELS.searchUsers}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{LABELS.table.user}</TableHead>
              <TableHead>{LABELS.table.status}</TableHead>
              <TableHead>{LABELS.table.plan}</TableHead>
              <TableHead className="hidden md:table-cell">{LABELS.table.lastActive}</TableHead>
              <TableHead className="hidden lg:table-cell">{LABELS.table.registered}</TableHead>
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
                      <p className="font-medium">{user.display_name || LABELS.noName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                <TableCell>{getPlanBadge(user)}</TableCell>
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
                          {LABELS.actions.grantPremium}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onRevokePremium(user)}>
                          <Crown className="w-4 h-4 mr-2 text-muted-foreground" />
                          {LABELS.actions.revokePremium}
                        </DropdownMenuItem>
                      )}
                      {user.premium_override !== 'none' && (
                        <DropdownMenuItem onClick={() => onResetOverride(user)}>
                          <RotateCcw className="w-4 h-4 mr-2 text-purple-500" />
                          {LABELS.actions.resetOverride}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onGrantBonus(user)}>
                        <Gift className="w-4 h-4 mr-2 text-primary" />
                        {LABELS.actions.grantBonus}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSendMessage(user)}>
                        <Mail className="w-4 h-4 mr-2 text-blue-500" />
                        {LABELS.actions.sendMessage}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === 'blocked' ? (
                        <DropdownMenuItem onClick={() => onUnblockUser(user)}>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          {LABELS.actions.unblock}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => onBlockUser(user)}
                          className="text-red-600"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          {LABELS.actions.block}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDeleteUser(user)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {LABELS.actions.deleteUser}
                      </DropdownMenuItem>
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
          {LABELS.noUsersFound}
        </div>
      )}
    </div>
  );
};
