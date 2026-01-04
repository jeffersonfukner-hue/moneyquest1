import { useTranslation } from 'react-i18next';
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

const ScoringAudit = () => {
  const { t } = useTranslation();

  const xpActions = [
    { action: 'transaction', xp: 5, type: 'recurring', limit: 'none', cooldown: 'none' },
    { action: 'dailyReward', xp: '10-25', type: 'daily', limit: '1/day', cooldown: '24h' },
    { action: 'questDaily', xp: '10-30', type: 'daily', limit: 'varies', cooldown: 'reset' },
    { action: 'questWeekly', xp: '50-100', type: 'weekly', limit: 'varies', cooldown: 'weekly' },
    { action: 'questMonthly', xp: '100-200', type: 'monthly', limit: 'varies', cooldown: 'monthly' },
    { action: 'badge', xp: '25-100', type: 'unique', limit: 'once', cooldown: 'none' },
    { action: 'adminBonus', xp: 'variable', type: 'manual', limit: 'none', cooldown: 'none' },
  ];

  const originMapping = [
    { action: 'transaction', layer: 'Frontend', file: 'useTransactions.tsx', function: 'addTransaction', event: 'insert' },
    { action: 'dailyReward', layer: 'Backend', file: 'claim_daily_reward()', function: 'RPC', event: 'user_action' },
    { action: 'quest', layer: 'Frontend', file: 'gameLogic.ts', function: 'checkAndUpdateQuests', event: 'auto_check' },
    { action: 'badge', layer: 'Frontend', file: 'gameLogic.ts', function: 'checkAndUpdateBadges', event: 'auto_check' },
    { action: 'adminBonus', layer: 'Backend', file: 'admin_grant_bonus()', function: 'RPC', event: 'admin_action' },
  ];

  const tables = [
    { name: 'profiles', fields: 'xp, level, level_title, streak, last_active_date', role: 'Main XP storage' },
    { name: 'xp_history', fields: 'user_id, xp_change, xp_before, xp_after, source, description', role: 'Audit trail' },
    { name: 'daily_rewards', fields: 'user_id, current_streak, last_claim_date, total_claims', role: 'Daily reward tracking' },
    { name: 'reward_history', fields: 'user_id, xp_earned, streak_day, multiplier, reward_type', role: 'Reward history' },
    { name: 'quests', fields: 'user_id, quest_key, progress_current, progress_target, is_completed', role: 'Quest progress' },
    { name: 'badges', fields: 'user_id, name, is_unlocked, unlocked_at', role: 'Badge unlocks' },
    { name: 'user_bonuses', fields: 'user_id, amount, bonus_type, granted_by, note', role: 'Admin bonuses' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            {t('admin.scoringAudit.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.scoringAudit.description')}
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t('admin.scoringAudit.readOnlyTitle')}</AlertTitle>
          <AlertDescription>
            {t('admin.scoringAudit.readOnlyDescription')}
          </AlertDescription>
        </Alert>

        {/* XP Values */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {t('admin.scoringAudit.xpValues.title')}
            </CardTitle>
            <CardDescription>{t('admin.scoringAudit.xpValues.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.scoringAudit.xpValues.action')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.xpValues.xp')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.xpValues.type')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.xpValues.limit')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.xpValues.cooldown')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {xpActions.map((item) => (
                  <TableRow key={item.action}>
                    <TableCell className="font-medium">
                      {t(`admin.scoringAudit.actions.${item.action}`)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">+{item.xp} XP</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`admin.scoringAudit.types.${item.type}`)}</Badge>
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
              {t('admin.scoringAudit.origin.title')}
            </CardTitle>
            <CardDescription>{t('admin.scoringAudit.origin.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.scoringAudit.origin.action')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.origin.layer')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.origin.file')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.origin.function')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.origin.event')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {originMapping.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {t(`admin.scoringAudit.actions.${item.action}`)}
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
              {t('admin.scoringAudit.tables.title')}
            </CardTitle>
            <CardDescription>{t('admin.scoringAudit.tables.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.scoringAudit.tables.name')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.tables.fields')}</TableHead>
                  <TableHead>{t('admin.scoringAudit.tables.role')}</TableHead>
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
              {t('admin.scoringAudit.streak.title')}
            </CardTitle>
            <CardDescription>{t('admin.scoringAudit.streak.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">{t('admin.scoringAudit.streak.calculation')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('admin.scoringAudit.streak.calculationDesc')}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">{t('admin.scoringAudit.streak.break')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('admin.scoringAudit.streak.breakDesc')}
                </p>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{t('admin.scoringAudit.streak.multipliers')}</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Day 1: 1.0x</Badge>
                <Badge variant="outline">Day 2: 1.1x</Badge>
                <Badge variant="outline">Day 3: 1.2x</Badge>
                <Badge variant="outline">Day 4: 1.3x</Badge>
                <Badge variant="outline">Day 5: 1.4x</Badge>
                <Badge variant="outline">Day 6: 1.5x</Badge>
                <Badge variant="secondary">Day 7+: 2.0x + 25 XP bonus</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {t('admin.scoringAudit.history.title')}
            </CardTitle>
            <CardDescription>{t('admin.scoringAudit.history.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-600 dark:text-green-400">✓ {t('admin.scoringAudit.history.tracked')}</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• {t('admin.scoringAudit.history.who')}</li>
                  <li>• {t('admin.scoringAudit.history.when')}</li>
                  <li>• {t('admin.scoringAudit.history.source')}</li>
                  <li>• {t('admin.scoringAudit.history.amount')}</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium">{t('admin.scoringAudit.history.sources')}</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• transaction</li>
                  <li>• quest</li>
                  <li>• badge</li>
                  <li>• daily_reward</li>
                  <li>• admin_bonus</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-amber-600 dark:text-amber-400">⚠ {t('admin.scoringAudit.history.notImplemented')}</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• {t('admin.scoringAudit.history.noReversal')}</li>
                  <li>• {t('admin.scoringAudit.history.noSpamProtection')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('admin.scoringAudit.alerts.spamTitle')}</AlertTitle>
            <AlertDescription>
              {t('admin.scoringAudit.alerts.spamDesc')}
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('admin.scoringAudit.alerts.reversalTitle')}</AlertTitle>
            <AlertDescription>
              {t('admin.scoringAudit.alerts.reversalDesc')}
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t('admin.scoringAudit.alerts.fixedXpTitle')}</AlertTitle>
            <AlertDescription>
              {t('admin.scoringAudit.alerts.fixedXpDesc')}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ScoringAudit;
