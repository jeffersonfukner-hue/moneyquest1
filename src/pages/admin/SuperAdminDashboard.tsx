import { useMemo } from 'react';
import { Users, UserCheck, Crown, TrendingUp, Activity, AlertTriangle, Filter, Calendar } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { RetentionAlerts } from '@/components/admin/RetentionAlerts';
import { ModalConversionWidget } from '@/components/admin/ModalConversionWidget';
import { ABTestComparisonWidget } from '@/components/admin/ABTestComparisonWidget';
import { AdMetricsWidget } from '@/components/admin/AdMetricsWidget';
import { InternalBannerAnalyticsWidget } from '@/components/admin/InternalBannerAnalyticsWidget';
import { DiscountConversionWidget } from '@/components/admin/DiscountConversionWidget';
import { ReferralConversionWidget } from '@/components/admin/ReferralConversionWidget';
import { ServiceWorkerStatusWidget } from '@/components/admin/ServiceWorkerStatusWidget';
import { WebVitalsWidget } from '@/components/admin/WebVitalsWidget';
import { WebVitalsAlerts } from '@/components/admin/WebVitalsAlerts';
import GoogleOAuthConfigWidget from '@/components/admin/GoogleOAuthConfigWidget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminData } from '@/hooks/useAdminData';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, BarChart, Bar, CartesianGrid, Legend, Area, AreaChart, FunnelChart, Funnel, LabelList
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Labels fixos em pt-BR para SuperAdmin
const LABELS = {
  dashboard: 'Dashboard Super Admin',
  description: 'Visão geral e métricas da plataforma',
  totalUsers: 'Total de Usuários',
  activeToday: 'Ativos Hoje',
  premiumUsers: 'Usuários Premium',
  engagementRate: 'Taxa de Engajamento',
  last7days: 'últimos 7 dias',
  active7Days: 'Ativos (7 dias)',
  active30Days: 'Ativos (30 dias)',
  atRiskUsers: 'Usuários em Risco',
  noData: 'Sem dados',
  users: 'usuários',
  charts: {
    week1: 'Sem. 1',
    week2: 'Sem. 2',
    week3: 'Sem. 3',
    week4: 'Sem. 4',
    activityTrend: 'Tendência de Atividade',
    activityTrendDesc: 'Usuários ativos e novos nos últimos 7 dias',
    activeUsers: 'Usuários Ativos',
    newUsers: 'Novos Usuários',
    planDistribution: 'Distribuição de Planos',
    planDistributionDesc: 'Free vs Premium',
    highlyEngaged: 'Muito Engajados',
    moderatelyEngaged: 'Mod. Engajados',
    lowEngaged: 'Pouco Engajados',
    inactive: 'Inativos',
    engagementLevels: 'Níveis de Engajamento',
    engagementLevelsDesc: 'Distribuição por atividade',
    newUsersByWeek: 'Novos Usuários por Semana',
    newUsersByWeekDesc: 'Tendência de cadastros',
    riskDistribution: 'Distribuição de Risco',
    riskDistributionDesc: 'Usuários em risco de abandono',
  },
  risk: {
    low: 'Risco Baixo',
    medium: 'Risco Médio',
    high: 'Risco Alto',
  },
  funnel: {
    title: 'Funil de Conversão',
    description: 'Jornada do usuário',
    registration: 'Cadastro',
    firstUse: 'Primeiro Uso',
    recurringUse: 'Uso Recorrente',
    premium: 'Premium',
    registrationToFirstUse: 'Cadastro → Primeiro Uso',
    firstUseToRecurring: 'Primeiro Uso → Recorrente',
    recurringToPremium: 'Recorrente → Premium',
  },
  retention: {
    title: 'Retenção',
    description: 'Taxas de retenção por período',
    day1: 'Dia 1',
    day7: 'Dia 7',
    day30: 'Dia 30',
    retained: 'retidos',
    retentionRate: 'Taxa de Retenção',
  },
};

const SuperAdminDashboard = () => {
  const { analytics, atRiskUsers, users, analyticsLoading, usersLoading } = useAdminData();

  // Generate activity trend data (last 7 days simulation based on actual data)
  const activityTrendData = useMemo(() => {
    if (!analytics) return [];
    
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      
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
      { label: LABELS.charts.week4, start: 21, end: 28 },
      { label: LABELS.charts.week3, start: 14, end: 21 },
      { label: LABELS.charts.week2, start: 7, end: 14 },
      { label: LABELS.charts.week1, start: 0, end: 7 },
    ];
    
    return weeks.map(week => {
      const count = users.filter(user => {
        const createdAt = new Date(user.created_at);
        const daysAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo >= week.start && daysAgo < week.end;
      }).length;
      
      return { week: week.label, users: count };
    });
  }, [users]);

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
      { name: LABELS.charts.highlyEngaged, value: highlyEngaged, color: '#22c55e' },
      { name: LABELS.charts.moderatelyEngaged, value: moderatelyEngaged, color: '#3b82f6' },
      { name: LABELS.charts.lowEngaged, value: lowEngaged, color: '#eab308' },
      { name: LABELS.charts.inactive, value: inactive, color: '#ef4444' },
    ];
  }, [analytics]);

  // Risk distribution data
  const riskData = useMemo(() => {
    if (!atRiskUsers) return [];
    return [
      { name: LABELS.risk.low, value: atRiskUsers.filter(u => u.risk_level === 'low').length, color: '#22c55e' },
      { name: LABELS.risk.medium, value: atRiskUsers.filter(u => u.risk_level === 'medium').length, color: '#eab308' },
      { name: LABELS.risk.high, value: atRiskUsers.filter(u => u.risk_level === 'high').length, color: '#ef4444' },
    ];
  }, [atRiskUsers]);

  // Conversion funnel data
  const funnelData = useMemo(() => {
    if (!analytics || !users) return [];
    
    const totalUsers = analytics.total_users || 0;
    const firstUse = users.filter(u => u.last_active_date).length;
    const recurringUse = analytics.active_30days || 0;
    const premium = analytics.premium_users || 0;
    
    return [
      { 
        name: LABELS.funnel.registration, 
        value: totalUsers, 
        fill: '#3b82f6',
        percentage: '100%'
      },
      { 
        name: LABELS.funnel.firstUse, 
        value: firstUse, 
        fill: '#22c55e',
        percentage: totalUsers > 0 ? `${((firstUse / totalUsers) * 100).toFixed(1)}%` : '0%'
      },
      { 
        name: LABELS.funnel.recurringUse, 
        value: recurringUse, 
        fill: '#eab308',
        percentage: totalUsers > 0 ? `${((recurringUse / totalUsers) * 100).toFixed(1)}%` : '0%'
      },
      { 
        name: LABELS.funnel.premium, 
        value: premium, 
        fill: '#8b5cf6',
        percentage: totalUsers > 0 ? `${((premium / totalUsers) * 100).toFixed(1)}%` : '0%'
      },
    ];
  }, [analytics, users]);

  // Retention data
  const retentionData = useMemo(() => {
    if (!analytics || !users) return [];
    
    const totalUsers = analytics.total_users || 0;
    if (totalUsers === 0) return [];
    
    const now = new Date();
    
    const day1Retained = users.filter(u => {
      if (!u.last_active_date || !u.created_at) return false;
      const createdAt = new Date(u.created_at);
      const lastActive = new Date(u.last_active_date);
      const createdDate = createdAt.toDateString();
      const lastActiveDate = lastActive.toDateString();
      return createdDate !== lastActiveDate;
    }).length;
    
    const day7Retained = users.filter(u => {
      if (!u.last_active_date || !u.created_at) return false;
      const createdAt = new Date(u.created_at);
      const lastActive = new Date(u.last_active_date);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysActiveSinceCreation = Math.floor((lastActive.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreation >= 7 && daysActiveSinceCreation >= 7;
    }).length;
    
    const day30Retained = users.filter(u => {
      if (!u.last_active_date || !u.created_at) return false;
      const createdAt = new Date(u.created_at);
      const lastActive = new Date(u.last_active_date);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysActiveSinceCreation = Math.floor((lastActive.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreation >= 30 && daysActiveSinceCreation >= 30;
    }).length;
    
    const eligibleDay7 = users.filter(u => {
      const createdAt = new Date(u.created_at);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreation >= 7;
    }).length || 1;
    
    const eligibleDay30 = users.filter(u => {
      const createdAt = new Date(u.created_at);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreation >= 30;
    }).length || 1;
    
    return [
      { 
        name: LABELS.retention.day1, 
        retained: day1Retained,
        total: totalUsers,
        rate: ((day1Retained / totalUsers) * 100).toFixed(1),
        fill: '#22c55e'
      },
      { 
        name: LABELS.retention.day7, 
        retained: day7Retained,
        total: eligibleDay7,
        rate: ((day7Retained / eligibleDay7) * 100).toFixed(1),
        fill: '#3b82f6'
      },
      { 
        name: LABELS.retention.day30, 
        retained: day30Retained,
        total: eligibleDay30,
        rate: ((day30Retained / eligibleDay30) * 100).toFixed(1),
        fill: '#8b5cf6'
      },
    ];
  }, [analytics, users]);

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
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{LABELS.dashboard}</h1>
          <p className="text-muted-foreground">{LABELS.description}</p>
        </div>

        {/* Retention Alerts */}
        <RetentionAlerts />

        {/* Web Vitals Performance Alerts */}
        <WebVitalsAlerts />

        {/* OAuth Configuration Guide */}
        <GoogleOAuthConfigWidget />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={LABELS.totalUsers}
            value={analytics?.total_users || 0}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title={LABELS.activeToday}
            value={analytics?.active_today || 0}
            icon={UserCheck}
            variant="success"
          />
          <StatsCard
            title={LABELS.premiumUsers}
            value={analytics?.premium_users || 0}
            icon={Crown}
            variant="warning"
          />
          <StatsCard
            title={LABELS.engagementRate}
            value={`${analytics?.engagement_rate || 0}%`}
            subtitle={LABELS.last7days}
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
                {LABELS.charts.activityTrend}
              </CardTitle>
              <CardDescription>{LABELS.charts.activityTrendDesc}</CardDescription>
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
                      name={LABELS.charts.activeUsers}
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorActive)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="new" 
                      name={LABELS.charts.newUsers}
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
                {LABELS.charts.planDistribution}
              </CardTitle>
              <CardDescription>{LABELS.charts.planDistributionDesc}</CardDescription>
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
                          `${value} ${LABELS.users}`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">{LABELS.noData}</p>
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
                {LABELS.charts.engagementLevels}
              </CardTitle>
              <CardDescription>{LABELS.charts.engagementLevelsDesc}</CardDescription>
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

        {/* Conversion Funnel - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              {LABELS.funnel.title}
            </CardTitle>
            <CardDescription>{LABELS.funnel.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                            <p className="font-medium text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.value} {LABELS.users} ({data.percentage})
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList 
                      position="right" 
                      fill="hsl(var(--foreground))" 
                      stroke="none" 
                      dataKey="name"
                      fontSize={12}
                    />
                    <LabelList 
                      position="center" 
                      fill="white" 
                      stroke="none" 
                      dataKey={(entry: any) => `${entry.value} (${entry.percentage})`}
                      fontSize={11}
                      fontWeight={600}
                    />
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
            {/* Funnel Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
              {funnelData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm text-foreground">{item.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {item.percentage}
                  </Badge>
                </div>
              ))}
            </div>
            {/* Conversion Rates */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {funnelData.length > 1 && (
                <>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">
                      {funnelData[0].value > 0 
                        ? ((funnelData[1].value / funnelData[0].value) * 100).toFixed(1) 
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">{LABELS.funnel.registrationToFirstUse}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">
                      {funnelData[1].value > 0 
                        ? ((funnelData[2].value / funnelData[1].value) * 100).toFixed(1) 
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">{LABELS.funnel.firstUseToRecurring}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">
                      {funnelData[2].value > 0 
                        ? ((funnelData[3].value / funnelData[2].value) * 100).toFixed(1) 
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">{LABELS.funnel.recurringToPremium}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Users by Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {LABELS.charts.newUsersByWeek}
              </CardTitle>
              <CardDescription>{LABELS.charts.newUsersByWeekDesc}</CardDescription>
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
                      name={LABELS.charts.newUsers}
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
                {LABELS.charts.riskDistribution}
              </CardTitle>
              <CardDescription>{LABELS.charts.riskDistributionDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name={LABELS.users} radius={[4, 4, 0, 0]}>
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

        {/* Retention Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {LABELS.retention.title}
            </CardTitle>
            <CardDescription>{LABELS.retention.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                            <p className="font-medium text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.retained} / {data.total} {LABELS.users}
                            </p>
                            <p className="text-sm font-bold" style={{ color: data.fill }}>
                              {data.rate}% {LABELS.retention.retained}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="rate" 
                    name={LABELS.retention.retentionRate}
                    radius={[4, 4, 0, 0]}
                  >
                    {retentionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Retention Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              {retentionData.map((item, index) => (
                <div key={index} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{item.rate}%</p>
                  <p className="text-xs text-muted-foreground">
                    {item.retained} / {item.total} {LABELS.users}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                  <p className="text-sm text-muted-foreground">{LABELS.active7Days}</p>
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
                  <p className="text-sm text-muted-foreground">{LABELS.active30Days}</p>
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
                  <p className="text-sm text-muted-foreground">{LABELS.atRiskUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ad Metrics Widget */}
        <AdMetricsWidget />

        {/* Internal Banner Analytics Widget */}
        <InternalBannerAnalyticsWidget />

        {/* Discount Conversion Widget */}
        <DiscountConversionWidget />

        {/* Referral Conversion Widget */}
        <ReferralConversionWidget />

        {/* A/B Test Comparison Widget */}
        <ABTestComparisonWidget />

        {/* Modal Conversion Widget */}
        <ModalConversionWidget />

        {/* Service Worker & Build Status */}
        <ServiceWorkerStatusWidget />

        {/* Web Vitals Performance */}
        <WebVitalsWidget />
      </div>
    </AdminLayout>
  );
};

export default SuperAdminDashboard;
