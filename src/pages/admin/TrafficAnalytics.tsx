import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
              {t('admin.traffic.title', 'Análise de Tráfego')}
            </h1>
            <p className="text-muted-foreground">
              {t('admin.traffic.subtitle', 'Monitore acessos, comportamento e origens do tráfego')}
            </p>
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
            {t('admin.traffic.internalNotice', 'Dados de desenvolvedores e administradores não são considerados nas métricas.')}
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title={t('admin.traffic.totalViews', 'Total de Acessos')}
            value={formatNumber(analytics?.total_views || 0)}
            icon={Eye}
          />
          <StatsCard
            title={t('admin.traffic.uniqueUsers', 'Usuários Únicos')}
            value={formatNumber(analytics?.unique_users || 0)}
            icon={Users}
          />
          <StatsCard
            title={t('admin.traffic.avgTime', 'Tempo Médio')}
            value={formatTime(analytics?.avg_time_on_page || 0)}
            icon={Clock}
          />
          <StatsCard
            title={t('admin.traffic.bounceRate', 'Taxa de Rejeição')}
            value={`${(analytics?.bounce_rate || 0).toFixed(1)}%`}
            icon={ArrowUpRight}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="pages">Páginas</TabsTrigger>
            <TabsTrigger value="sources">Origens</TabsTrigger>
            <TabsTrigger value="errors">Erros</TabsTrigger>
            <TabsTrigger value="suspicious">Suspeitos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Views by Day Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('admin.traffic.viewsByDay', 'Acessos por Dia')}
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
                    {t('admin.traffic.viewsByHour', 'Acessos por Hora')}
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
                    {t('admin.traffic.viewsByDevice', 'Dispositivos')}
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
                  {t('admin.traffic.topPages', 'Páginas Mais Acessadas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Página</TableHead>
                      <TableHead className="text-right">Acessos</TableHead>
                      <TableHead className="text-right">Usuários</TableHead>
                      <TableHead className="text-right">Tempo Médio</TableHead>
                      <TableHead className="text-right">Taxa de Saída</TableHead>
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
                          Nenhum dado disponível
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
                    Origem do Tráfego
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
                    Por País
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
                  <CardTitle>Campanhas UTM</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Medium</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead className="text-right">Acessos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sources.by_utm.map((utm, i) => (
                        <TableRow key={i}>
                          <TableCell>{utm.utm_source || '-'}</TableCell>
                          <TableCell>{utm.utm_medium || '-'}</TableCell>
                          <TableCell>{utm.utm_campaign || '-'}</TableCell>
                          <TableCell className="text-right font-medium">{formatNumber(utm.views)}</TableCell>
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
                  Erros de Navegação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead className="text-right">Ocorrências</TableHead>
                      <TableHead className="text-right">Última</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors?.map((error, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm truncate max-w-[250px]">
                          {error.page_url}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            error.error_code === 404 ? 'secondary' : 
                            error.error_code >= 500 ? 'destructive' : 'outline'
                          }>
                            {error.error_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {error.origin || 'Direto'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {error.occurrences}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {format(new Date(error.last_occurrence), 'dd/MM HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!errors || errors.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          ✓ Nenhum erro registrado no período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suspicious Tab */}
          <TabsContent value="suspicious" className="space-y-6">
            {/* High Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Alta Frequência de Requisições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead className="text-right">Requisições</TableHead>
                      <TableHead className="text-right">Primeira</TableHead>
                      <TableHead className="text-right">Última</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspicious?.high_frequency?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{item.session_id.slice(0, 20)}...</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {item.request_count}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {format(new Date(item.first_request), 'dd/MM HH:mm')}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {format(new Date(item.last_request), 'dd/MM HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!suspicious?.high_frequency || suspicious.high_frequency.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          ✓ Nenhuma atividade suspeita detectada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Admin Access Attempts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Tentativas de Acesso Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead className="text-right">Tentativas</TableHead>
                      <TableHead className="text-right">Última</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspicious?.admin_attempts?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{item.page_url}</TableCell>
                        <TableCell className="font-mono text-sm">{item.session_id.slice(0, 15)}...</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {item.attempts}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {format(new Date(item.last_attempt), 'dd/MM HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!suspicious?.admin_attempts || suspicious.admin_attempts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          ✓ Nenhuma tentativa de invasão detectada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Unusual Origins */}
            {suspicious?.unusual_origins && suspicious.unusual_origins.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-amber-500" />
                    Origens Incomuns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>País</TableHead>
                        <TableHead className="text-right">Acessos</TableHead>
                        <TableHead className="text-right">Sessões</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suspicious.unusual_origins.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.country}</TableCell>
                          <TableCell className="text-right">{item.views}</TableCell>
                          <TableCell className="text-right">{item.sessions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
