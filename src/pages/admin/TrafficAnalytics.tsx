import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Eye, Users, Clock, Monitor, Smartphone, Tablet, 
  Globe, AlertTriangle, RefreshCw, TrendingUp, ArrowUpRight,
  BarChart3, PieChart as PieChartIcon, MapPin, Link2, Info
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTrafficAnalytics, DateRange } from '@/hooks/useTrafficAnalytics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Labels fixos em pt-BR para SuperAdmin
const LABELS = {
  title: 'Análise de Tráfego',
  subtitle: 'Monitore acessos, comportamento e origens do tráfego',
  totalViews: 'Total de Acessos',
  uniqueUsers: 'Usuários Únicos',
  avgTime: 'Tempo Médio',
  bounceRate: 'Taxa de Rejeição',
  viewsByDay: 'Acessos por Dia',
  viewsByHour: 'Acessos por Hora',
  viewsByDevice: 'Dispositivos',
  topPages: 'Páginas Mais Acessadas',
  internalNotice: 'Dados de desenvolvedores e administradores não são considerados nas métricas.',
  tabs: {
    overview: 'Visão Geral',
    pages: 'Páginas',
    sources: 'Origens',
    errors: 'Erros',
    suspicious: 'Suspeitos',
  },
  table: {
    page: 'Página',
    views: 'Acessos',
    users: 'Usuários',
    avgTime: 'Tempo Médio',
    exitRate: 'Taxa de Saída',
    noData: 'Nenhum dado disponível',
  },
  sources: {
    origin: 'Origem do Tráfego',
    byCountry: 'Por País',
    utmCampaigns: 'Campanhas UTM',
  },
  errors: {
    title: 'Erros Recentes',
    code: 'Código',
    page: 'Página',
    count: 'Ocorrências',
    lastSeen: 'Última Ocorrência',
    noErrors: 'Nenhum erro registrado',
  },
  suspicious: {
    title: 'Atividade Suspeita',
    session: 'Sessão',
    ip: 'IP',
    reason: 'Motivo',
    date: 'Data',
    noSuspicious: 'Nenhuma atividade suspeita detectada',
  },
};

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ElementType;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const DeviceIcon = ({ device }: { device: string }) => {
  switch (device.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
};

export default function TrafficAnalytics() {
  const {
    dateRange,
    setDateRange,
    analytics,
    topPages,
    sources,
    errors,
    suspicious,
    isLoading,
    refetch,
  } = useTrafficAnalytics();

  const [activeTab, setActiveTab] = useState('overview');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              {LABELS.title}
            </h1>
            <p className="text-muted-foreground">{LABELS.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Internal Users Notice */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            {LABELS.internalNotice}
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title={LABELS.totalViews}
            value={formatNumber(analytics?.total_views || 0)}
            icon={Eye}
          />
          <StatsCard
            title={LABELS.uniqueUsers}
            value={formatNumber(analytics?.unique_users || 0)}
            icon={Users}
          />
          <StatsCard
            title={LABELS.avgTime}
            value={formatTime(analytics?.avg_time_on_page || 0)}
            icon={Clock}
          />
          <StatsCard
            title={LABELS.bounceRate}
            value={`${(analytics?.bounce_rate || 0).toFixed(1)}%`}
            icon={ArrowUpRight}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{LABELS.tabs.overview}</TabsTrigger>
            <TabsTrigger value="pages">{LABELS.tabs.pages}</TabsTrigger>
            <TabsTrigger value="sources">{LABELS.tabs.sources}</TabsTrigger>
            <TabsTrigger value="errors">{LABELS.tabs.errors}</TabsTrigger>
            <TabsTrigger value="suspicious">{LABELS.tabs.suspicious}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Views by Day Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {LABELS.viewsByDay}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.views_by_day?.slice().reverse() || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => format(new Date(v), 'dd/MM', { locale: ptBR })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(v) => format(new Date(v), 'dd/MM/yyyy', { locale: ptBR })}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.2}
                        name="Acessos"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="hsl(var(--chart-2))" 
                        fill="hsl(var(--chart-2))" 
                        fillOpacity={0.2}
                        name="Sessões"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Views by Hour */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {LABELS.viewsByHour}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.views_by_hour || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          labelFormatter={(v) => `${v}:00`}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Views by Device */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    {LABELS.viewsByDevice}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.views_by_device || []}
                          dataKey="views"
                          nameKey="device"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics?.views_by_device?.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {LABELS.topPages}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{LABELS.table.page}</TableHead>
                      <TableHead className="text-right">{LABELS.table.views}</TableHead>
                      <TableHead className="text-right">{LABELS.table.users}</TableHead>
                      <TableHead className="text-right">{LABELS.table.avgTime}</TableHead>
                      <TableHead className="text-right">{LABELS.table.exitRate}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPages?.map((page, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[300px]">{page.page_url}</p>
                            {page.page_title && (
                              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {page.page_title}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(page.total_views)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(page.unique_users)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatTime(page.avg_time)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={page.exit_rate > 70 ? 'destructive' : page.exit_rate > 40 ? 'secondary' : 'outline'}>
                            {page.exit_rate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!topPages || topPages.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {LABELS.table.noData}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Traffic Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {LABELS.sources.origin}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sources?.by_source || []}
                          dataKey="views"
                          nameKey="source"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sources?.by_source?.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* By Country */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {LABELS.sources.byCountry}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sources?.by_country?.slice(0, 10) || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="country" type="category" width={100} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* UTM Parameters */}
            {sources?.by_utm && sources.by_utm.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{LABELS.sources.utmCampaigns}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Mídia</TableHead>
                        <TableHead className="text-right">Acessos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sources.by_utm.map((utm, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{utm.utm_campaign || '-'}</TableCell>
                          <TableCell>{utm.utm_source || '-'}</TableCell>
                          <TableCell>{utm.utm_medium || '-'}</TableCell>
                          <TableCell className="text-right">{utm.views}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  {LABELS.errors.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{LABELS.errors.code}</TableHead>
                      <TableHead>{LABELS.errors.page}</TableHead>
                      <TableHead className="text-right">{LABELS.errors.count}</TableHead>
                      <TableHead className="text-right">{LABELS.errors.lastSeen}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors?.map((error, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="destructive">{error.error_code}</Badge>
                        </TableCell>
                        <TableCell className="truncate max-w-[300px]">{error.page_url}</TableCell>
                        <TableCell className="text-right">{error.occurrences}</TableCell>
                        <TableCell className="text-right">
                          {format(new Date(error.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!errors || errors.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {LABELS.errors.noErrors}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suspicious Tab */}
          <TabsContent value="suspicious">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  {LABELS.suspicious.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{LABELS.suspicious.session}</TableHead>
                      <TableHead>{LABELS.suspicious.reason}</TableHead>
                      <TableHead className="text-right">{LABELS.suspicious.date}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspicious && Array.isArray(suspicious) && suspicious.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{item.session_id?.slice(0, 8)}...</TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell className="text-right">
                          {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!suspicious || !Array.isArray(suspicious) || suspicious.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          {LABELS.suspicious.noSuspicious}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
