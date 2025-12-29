import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Crown, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminData } from '@/hooks/useAdminData';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, BarChart, Bar, CartesianGrid, Legend, Area, AreaChart 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const SuperAdminDashboard = () => {
  const { t } = useTranslation();
  const { analytics, atRiskUsers, users, analyticsLoading, usersLoading } = useAdminData();

  // Generate activity trend data (last 7 days simulation based on actual data)
  const activityTrendData = useMemo(() => {
    if (!analytics) return [];
    
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Simulate decreasing activity as we go back in time
      const baseActive = analytics.active_today || 0;
      const variation = Math.floor(Math.random() * 3) - 1;
      const dayActive = Math.max(0, baseActive + (i === 0 ? 0 : Math.floor(baseActive * (0.1 * i)) + variation));
      
      days.push({
        day: dayName,
        active: i === 0 ? analytics.active_today : dayActive,
        new: Math.floor(Math.random() * 3) + (i === 0 ? 1 : 0),
      });
    }
    
    return days;
  }, [analytics]);

  // Generate user registration trend data (last 30 days grouped by week)
  const registrationTrendData = useMemo(() => {
    if (!users) return [];
    
    const now = new Date();
    const weeks = [
      { label: t('admin.charts.week4'), start: 21, end: 28 },
      { label: t('admin.charts.week3'), start: 14, end: 21 },
      { label: t('admin.charts.week2'), start: 7, end: 14 },
      { label: t('admin.charts.week1'), start: 0, end: 7 },
    ];
    
    return weeks.map(week => {
      const count = users.filter(user => {
        const createdAt = new Date(user.created_at);
        const daysAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo >= week.start && daysAgo < week.end;
      }).length;
      
      return { week: week.label, users: count };
    });
  }, [users, t]);

  // Plan distribution data with percentages
  const planData = useMemo(() => {
    if (!analytics) return [];
    const total = (analytics.free_users || 0) + (analytics.premium_users || 0);
    if (total === 0) return [];
    
    return [
      { 
        name: 'Free', 
        value: analytics.free_users || 0, 
        percentage: ((analytics.free_users || 0) / total * 100).toFixed(1),
        color: 'hsl(var(--muted-foreground))' 
      },
      { 
        name: 'Premium', 
        value: analytics.premium_users || 0, 
        percentage: ((analytics.premium_users || 0) / total * 100).toFixed(1),
        color: 'hsl(var(--chart-1))' 
      },
    ];
  }, [analytics]);

  // Engagement levels data
  const engagementData = useMemo(() => {
    if (!analytics) return [];
    
    const total = analytics.total_users || 1;
    const highlyEngaged = analytics.active_today || 0;
    const moderatelyEngaged = Math.max(0, (analytics.active_7days || 0) - highlyEngaged);
    const lowEngaged = Math.max(0, (analytics.active_30days || 0) - (analytics.active_7days || 0));
    const inactive = Math.max(0, total - (analytics.active_30days || 0));
    
    return [
      { name: t('admin.charts.highlyEngaged'), value: highlyEngaged, color: '#22c55e' },
      { name: t('admin.charts.moderatelyEngaged'), value: moderatelyEngaged, color: '#3b82f6' },
      { name: t('admin.charts.lowEngaged'), value: lowEngaged, color: '#eab308' },
      { name: t('admin.charts.inactive'), value: inactive, color: '#ef4444' },
    ];
  }, [analytics, t]);

  // Risk distribution data
  const riskData = useMemo(() => {
    if (!atRiskUsers) return [];
    return [
      { name: t('admin.risk.low'), value: atRiskUsers.filter(u => u.risk_level === 'low').length, color: '#22c55e' },
      { name: t('admin.risk.medium'), value: atRiskUsers.filter(u => u.risk_level === 'medium').length, color: '#eab308' },
      { name: t('admin.risk.high'), value: atRiskUsers.filter(u => u.risk_level === 'high').length, color: '#ef4444' },
    ];
  }, [atRiskUsers, t]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  if (analyticsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2].map(i => <Skeleton key={i} className="h-80" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground">{t('admin.description')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('admin.totalUsers')}
            value={analytics?.total_users || 0}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title={t('admin.activeToday')}
            value={analytics?.active_today || 0}
            icon={UserCheck}
            variant="success"
          />
          <StatsCard
            title={t('admin.premiumUsers')}
            value={analytics?.premium_users || 0}
            icon={Crown}
            variant="warning"
          />
          <StatsCard
            title={t('admin.engagementRate')}
            value={`${analytics?.engagement_rate || 0}%`}
            subtitle={t('admin.charts.last7days')}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Trend - Line/Area Chart */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {t('admin.charts.activityTrend')}
              </CardTitle>
              <CardDescription>{t('admin.charts.activityTrendDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityTrendData}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="active" 
                      name={t('admin.charts.activeUsers')}
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorActive)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="new" 
                      name={t('admin.charts.newUsers')}
                      stroke="#22c55e" 
                      fillOpacity={1} 
                      fill="url(#colorNew)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Free vs Premium - Enhanced Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                {t('admin.charts.planDistribution')}
              </CardTitle>
              <CardDescription>{t('admin.charts.planDistributionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center">
                {planData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {planData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${value} ${t('admin.charts.users')}`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">{t('common.noData')}</p>
                )}
              </div>
              {/* Legend with stats */}
              <div className="flex justify-center gap-6 mt-4">
                {planData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-foreground font-medium">{item.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.value} ({item.percentage}%)
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Levels - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t('admin.charts.engagementLevels')}
              </CardTitle>
              <CardDescription>{t('admin.charts.engagementLevelsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Users by Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t('admin.charts.newUsersByWeek')}
              </CardTitle>
              <CardDescription>{t('admin.charts.newUsersByWeekDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="users" 
                      name={t('admin.charts.newUsers')}
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('admin.charts.riskDistribution')}
              </CardTitle>
              <CardDescription>{t('admin.charts.riskDistributionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name={t('admin.charts.users')} radius={[4, 4, 0, 0]}>
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

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{analytics?.active_7days || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.active7Days')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{analytics?.active_30days || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.active30Days')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{atRiskUsers?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.atRiskUsers')}</p>
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
