import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Crown, TrendingUp, Activity } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminData } from '@/hooks/useAdminData';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const SuperAdminDashboard = () => {
  const { t } = useTranslation();
  const { analytics, atRiskUsers, analyticsLoading } = useAdminData();

  const planData = analytics ? [
    { name: 'Free', value: analytics.free_users, color: 'hsl(var(--muted-foreground))' },
    { name: 'Premium', value: analytics.premium_users, color: 'hsl(var(--primary))' },
  ] : [];

  const riskData = atRiskUsers ? [
    { name: t('admin.risk.low'), value: atRiskUsers.filter(u => u.risk_level === 'low').length, color: '#22c55e' },
    { name: t('admin.risk.medium'), value: atRiskUsers.filter(u => u.risk_level === 'medium').length, color: '#eab308' },
    { name: t('admin.risk.high'), value: atRiskUsers.filter(u => u.risk_level === 'high').length, color: '#ef4444' },
  ] : [];

  if (analyticsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{t('admin.dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('admin.dashboard.subtitle')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('admin.stats.totalUsers')}
            value={analytics?.total_users || 0}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title={t('admin.stats.activeToday')}
            value={analytics?.active_today || 0}
            icon={UserCheck}
            variant="success"
          />
          <StatsCard
            title={t('admin.stats.premiumUsers')}
            value={analytics?.premium_users || 0}
            icon={Crown}
            variant="warning"
          />
          <StatsCard
            title={t('admin.stats.engagementRate')}
            value={`${analytics?.engagement_rate || 0}%`}
            subtitle={t('admin.stats.last7days')}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Free vs Premium */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.charts.planDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk Levels */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.charts.riskLevels')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.active_7days || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.stats.active7days')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.active_30days || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.stats.active30days')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{atRiskUsers?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.stats.atRiskUsers')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SuperAdminDashboard;
