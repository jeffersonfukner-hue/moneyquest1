import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, 
  Calculator, 
  Database, 
  FileCode, 
  Gift, 
  History, 
  Flame,
  Info
} from 'lucide-react';

// Labels fixos em pt-BR para o SuperAdmin
const LABELS = {
  title: 'Auditoria de Pontuação (XP)',
  description: 'Documentação técnica do sistema de pontuação e gamificação.',
  readOnlyTitle: 'Somente Leitura',
  readOnlyDescription: 'Esta página é apenas para consulta. Alterações nos valores de XP devem ser feitas diretamente no código ou banco de dados.',
  xpValues: {
    title: 'Valores de XP por Ação',
    description: 'Quanto XP cada ação concede ao usuário.',
    action: 'Ação',
    xp: 'XP',
    type: 'Tipo',
    limit: 'Limite',
    cooldown: 'Cooldown',
  },
  actions: {
    transaction: 'Transação',
    dailyReward: 'Recompensa Diária',
    questDaily: 'Missão Diária',
    questWeekly: 'Missão Semanal',
    questMonthly: 'Missão Mensal',
    badge: 'Badge/Conquista',
    adminBonus: 'Bônus Admin',
    quest: 'Missão',
  },
  types: {
    recurring: 'Recorrente',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    unique: 'Único',
    manual: 'Manual',
  },
  origin: {
    title: 'Mapeamento de Origem',
    description: 'De onde vem cada ganho de XP no sistema.',
    action: 'Ação',
    layer: 'Camada',
    file: 'Arquivo/RPC',
    function: 'Função',
    event: 'Evento',
  },
  tables: {
    title: 'Tabelas do Banco de Dados',
    description: 'Estrutura de dados relacionada ao sistema de XP.',
    name: 'Tabela',
    fields: 'Campos Principais',
    role: 'Função',
  },
  streak: {
    title: 'Regras de Streak',
    description: 'Como funciona o sistema de sequência diária.',
    calculation: 'Cálculo do Streak',
    calculationDesc: 'O streak é incrementado quando o usuário realiza atividade em dias consecutivos. Verificado via last_active_date no profiles.',
    break: 'Quebra de Streak',
    breakDesc: 'Se o usuário ficar 1+ dias sem atividade, o streak é resetado para 0.',
    multipliers: 'Multiplicadores de XP por Dia de Streak',
  },
  history: {
    title: 'Sistema de Histórico',
    description: 'Como o histórico de XP é rastreado.',
    tracked: 'Rastreado',
    who: 'Quem ganhou (user_id)',
    when: 'Quando (created_at)',
    source: 'Origem (source)',
    amount: 'Quantidade (xp_change)',
    sources: 'Fontes Possíveis',
    implemented: 'Implementado',
    spamProtection: 'Proteção anti-spam',
    dailyLimit: 'Limite diário de 15 transações com XP',
  },
  alerts: {
    spamProtectedTitle: 'Proteção Anti-Spam Ativa',
    spamProtectedDesc: 'O sistema limita a 15 transações com XP por dia por usuário. Após o limite, transações são registradas normalmente mas com 0 XP.',
    reversalTitle: 'Reversão de XP Automática',
    reversalDesc: 'Ao excluir uma transação, o XP é automaticamente revertido via trigger no banco de dados. O histórico é registrado em xp_history com source "transaction_deleted".',
    fixedXpTitle: 'XP Fixo por Transação',
    fixedXpDesc: 'Cada transação concede exatamente +5 XP, independente do valor monetário. Isso evita manipulação via micro-transações.',
  },
};

const ScoringAudit = () => {
  const xpActions = [
    { action: 'transaction', xp: 5, type: 'recurring', limit: '15/dia', cooldown: 'reset 00:00' },
    { action: 'dailyReward', xp: '10-25', type: 'daily', limit: '1/dia', cooldown: '24h' },
    { action: 'questDaily', xp: '10-30', type: 'daily', limit: 'variável', cooldown: 'reset' },
    { action: 'questWeekly', xp: '50-100', type: 'weekly', limit: 'variável', cooldown: 'semanal' },
    { action: 'questMonthly', xp: '100-200', type: 'monthly', limit: 'variável', cooldown: 'mensal' },
    { action: 'badge', xp: '25-100', type: 'unique', limit: 'único', cooldown: 'nenhum' },
    { action: 'adminBonus', xp: 'variável', type: 'manual', limit: 'nenhum', cooldown: 'nenhum' },
  ];

  const originMapping = [
    { action: 'transaction', layer: 'Backend', file: 'check_transaction_xp_limit()', function: 'RPC + useTransactions', event: 'insert' },
    { action: 'dailyReward', layer: 'Backend', file: 'claim_daily_reward()', function: 'RPC', event: 'user_action' },
    { action: 'quest', layer: 'Frontend', file: 'gameLogic.ts', function: 'checkAndUpdateQuests', event: 'auto_check' },
    { action: 'badge', layer: 'Frontend', file: 'gameLogic.ts', function: 'checkAndUpdateBadges', event: 'auto_check' },
    { action: 'adminBonus', layer: 'Backend', file: 'admin_grant_bonus()', function: 'RPC', event: 'admin_action' },
  ];

  const tables = [
    { name: 'profiles', fields: 'xp, level, level_title, streak, last_active_date', role: 'Armazenamento principal de XP' },
    { name: 'xp_history', fields: 'user_id, xp_change, xp_before, xp_after, source, description', role: 'Trilha de auditoria' },
    { name: 'daily_rewards', fields: 'user_id, current_streak, last_claim_date, total_claims', role: 'Rastreamento de recompensa diária' },
    { name: 'daily_transaction_xp_limits', fields: 'user_id, transaction_date, transactions_with_xp', role: 'Limite anti-spam' },
    { name: 'reward_history', fields: 'user_id, xp_earned, streak_day, multiplier, reward_type', role: 'Histórico de recompensas' },
    { name: 'quests', fields: 'user_id, quest_key, progress_current, progress_target, is_completed', role: 'Progresso de missões' },
    { name: 'badges', fields: 'user_id, name, is_unlocked, unlocked_at', role: 'Desbloqueio de conquistas' },
    { name: 'user_bonuses', fields: 'user_id, amount, bonus_type, granted_by, note', role: 'Bônus de admin' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            {LABELS.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {LABELS.description}
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{LABELS.readOnlyTitle}</AlertTitle>
          <AlertDescription>
            {LABELS.readOnlyDescription}
          </AlertDescription>
        </Alert>

        {/* XP Values */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {LABELS.xpValues.title}
            </CardTitle>
            <CardDescription>{LABELS.xpValues.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{LABELS.xpValues.action}</TableHead>
                  <TableHead>{LABELS.xpValues.xp}</TableHead>
                  <TableHead>{LABELS.xpValues.type}</TableHead>
                  <TableHead>{LABELS.xpValues.limit}</TableHead>
                  <TableHead>{LABELS.xpValues.cooldown}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {xpActions.map((item) => (
                  <TableRow key={item.action}>
                    <TableCell className="font-medium">
                      {LABELS.actions[item.action as keyof typeof LABELS.actions]}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">+{item.xp} XP</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{LABELS.types[item.type as keyof typeof LABELS.types]}</Badge>
                    </TableCell>
                    <TableCell>{item.limit}</TableCell>
                    <TableCell>{item.cooldown}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Origin Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              {LABELS.origin.title}
            </CardTitle>
            <CardDescription>{LABELS.origin.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{LABELS.origin.action}</TableHead>
                  <TableHead>{LABELS.origin.layer}</TableHead>
                  <TableHead>{LABELS.origin.file}</TableHead>
                  <TableHead>{LABELS.origin.function}</TableHead>
                  <TableHead>{LABELS.origin.event}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {originMapping.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {LABELS.actions[item.action as keyof typeof LABELS.actions]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.layer === 'Backend' ? 'default' : 'secondary'}>
                        {item.layer}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.file}</TableCell>
                    <TableCell className="font-mono text-xs">{item.function}</TableCell>
                    <TableCell>{item.event}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Database Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {LABELS.tables.title}
            </CardTitle>
            <CardDescription>{LABELS.tables.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{LABELS.tables.name}</TableHead>
                  <TableHead>{LABELS.tables.fields}</TableHead>
                  <TableHead>{LABELS.tables.role}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell className="font-mono font-medium">{table.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{table.fields}</TableCell>
                    <TableCell>{table.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Streak Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              {LABELS.streak.title}
            </CardTitle>
            <CardDescription>{LABELS.streak.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">{LABELS.streak.calculation}</h4>
                <p className="text-sm text-muted-foreground">
                  {LABELS.streak.calculationDesc}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">{LABELS.streak.break}</h4>
                <p className="text-sm text-muted-foreground">
                  {LABELS.streak.breakDesc}
                </p>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{LABELS.streak.multipliers}</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Dia 1: 1.0x</Badge>
                <Badge variant="outline">Dia 2: 1.1x</Badge>
                <Badge variant="outline">Dia 3: 1.2x</Badge>
                <Badge variant="outline">Dia 4: 1.3x</Badge>
                <Badge variant="outline">Dia 5: 1.4x</Badge>
                <Badge variant="outline">Dia 6: 1.5x</Badge>
                <Badge variant="secondary">Dia 7+: 2.0x + 25 XP bônus</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {LABELS.history.title}
            </CardTitle>
            <CardDescription>{LABELS.history.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-600 dark:text-green-400">✓ {LABELS.history.tracked}</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• {LABELS.history.who}</li>
                  <li>• {LABELS.history.when}</li>
                  <li>• {LABELS.history.source}</li>
                  <li>• {LABELS.history.amount}</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium">{LABELS.history.sources}</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• transaction</li>
                  <li>• quest</li>
                  <li>• badge</li>
                  <li>• daily_reward</li>
                  <li>• admin_bonus</li>
                  <li>• transaction_limit_reached</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-600 dark:text-green-400">✓ {LABELS.history.implemented}</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• {LABELS.history.spamProtection}</li>
                  <li>• {LABELS.history.dailyLimit}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{LABELS.alerts.spamProtectedTitle}</AlertTitle>
            <AlertDescription>
              {LABELS.alerts.spamProtectedDesc}
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{LABELS.alerts.reversalTitle}</AlertTitle>
            <AlertDescription>
              {LABELS.alerts.reversalDesc}
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{LABELS.alerts.fixedXpTitle}</AlertTitle>
            <AlertDescription>
              {LABELS.alerts.fixedXpDesc}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ScoringAudit;
