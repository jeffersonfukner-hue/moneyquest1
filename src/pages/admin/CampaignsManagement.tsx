import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Power, PowerOff, Calendar, Eye, BarChart3 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CampaignAnalyticsWidget } from '@/components/admin/CampaignAnalyticsWidget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  title: string;
  subtitle: string | null;
  cta_text: string;
  cta_link: string;
  icon: string;
  bg_gradient: string;
  text_color: string;
  priority: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  target_audience: string;
  created_at: string;
}

const getCampaignTypes = (t: (key: string) => string) => [
  { value: 'seasonal', label: t('admin.campaigns.types.seasonal'), icon: '🎄' },
  { value: 'promo', label: t('admin.campaigns.types.promo'), icon: '🎉' },
  { value: 'discount', label: t('admin.campaigns.types.discount'), icon: '💰' },
  { value: 'feature', label: t('admin.campaigns.types.feature'), icon: '✨' },
];

const getTargetAudiences = (t: (key: string) => string) => [
  { value: 'all', label: t('admin.campaigns.audiences.all') },
  { value: 'free', label: t('admin.campaigns.audiences.free') },
  { value: 'premium', label: t('admin.campaigns.audiences.premium') },
  { value: 'trial', label: t('admin.campaigns.audiences.trial') },
];

const getGradientPresets = (t: (key: string) => string) => [
  { value: 'from-primary/20 via-primary/15 to-primary/20', label: t('admin.campaigns.gradients.primary'), preview: 'bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20' },
  { value: 'from-orange-500/30 via-red-500/20 to-orange-500/30', label: t('admin.campaigns.gradients.blackFriday'), preview: 'bg-gradient-to-r from-orange-500/30 via-red-500/20 to-orange-500/30' },
  { value: 'from-green-500/30 via-red-500/20 to-green-500/30', label: t('admin.campaigns.gradients.christmas'), preview: 'bg-gradient-to-r from-green-500/30 via-red-500/20 to-green-500/30' },
  { value: 'from-purple-500/30 via-blue-500/20 to-purple-500/30', label: t('admin.campaigns.gradients.newYear'), preview: 'bg-gradient-to-r from-purple-500/30 via-blue-500/20 to-purple-500/30' },
  { value: 'from-yellow-500/30 via-green-500/20 to-yellow-500/30', label: t('admin.campaigns.gradients.carnival'), preview: 'bg-gradient-to-r from-yellow-500/30 via-green-500/20 to-yellow-500/30' },
  { value: 'from-blue-500/30 via-cyan-500/20 to-blue-500/30', label: t('admin.campaigns.gradients.tech'), preview: 'bg-gradient-to-r from-blue-500/30 via-cyan-500/20 to-blue-500/30' },
];

const defaultFormData = {
  name: '',
  campaign_type: 'promo',
  title: '',
  subtitle: '',
  cta_text: '',
  cta_link: '/premium',
  icon: '🎉',
  bg_gradient: 'from-primary/20 via-primary/15 to-primary/20',
  priority: 50,
  is_active: false,
  start_date: '',
  end_date: '',
  target_audience: 'all',
};

const CampaignsManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Translated config arrays
  const CAMPAIGN_TYPES = getCampaignTypes(t);
  const TARGET_AUDIENCES = getTargetAudiences(t);
  const GRADIENT_PRESETS = getGradientPresets(t);

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_campaigns')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
  });

  // Upsert campaign mutation
  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const { data: result, error } = await supabase.rpc('admin_upsert_campaign', {
        p_id: data.id || null,
        p_name: data.name,
        p_campaign_type: data.campaign_type,
        p_title: data.title,
        p_subtitle: data.subtitle || null,
        p_cta_text: data.cta_text,
        p_cta_link: data.cta_link,
        p_icon: data.icon,
        p_bg_gradient: data.bg_gradient,
        p_priority: data.priority,
        p_is_active: data.is_active,
        p_start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        p_end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        p_target_audience: data.target_audience,
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDialogOpen(false);
      resetForm();
      toast.success(editingCampaign ? t('admin.campaigns.updated') : t('admin.campaigns.created'));
    },
    onError: (error) => {
      toast.error(t('admin.campaigns.saveError') + ': ' + error.message);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('internal_campaigns')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('admin.campaigns.statusUpdated'));
    },
    onError: (error) => {
      toast.error(t('admin.campaigns.saveError') + ': ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('internal_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('admin.campaigns.deleted'));
    },
    onError: (error) => {
      toast.error(t('admin.campaigns.saveError') + ': ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      campaign_type: campaign.campaign_type,
      title: campaign.title,
      subtitle: campaign.subtitle || '',
      cta_text: campaign.cta_text,
      cta_link: campaign.cta_link,
      icon: campaign.icon,
      bg_gradient: campaign.bg_gradient,
      priority: campaign.priority,
      is_active: campaign.is_active,
      start_date: campaign.start_date ? format(new Date(campaign.start_date), "yyyy-MM-dd'T'HH:mm") : '',
      end_date: campaign.end_date ? format(new Date(campaign.end_date), "yyyy-MM-dd'T'HH:mm") : '',
      target_audience: campaign.target_audience,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate({
      ...formData,
      id: editingCampaign?.id,
    });
  };

  const getTypeInfo = (type: string) => {
    return CAMPAIGN_TYPES.find(t => t.value === type) || CAMPAIGN_TYPES[0];
  };

  const getAudienceLabel = (audience: string) => {
    return TARGET_AUDIENCES.find(a => a.value === audience)?.label || audience;
  };

  const isDateActive = (campaign: Campaign) => {
    const now = new Date();
    if (campaign.start_date && new Date(campaign.start_date) > now) return false;
    if (campaign.end_date && new Date(campaign.end_date) < now) return false;
    return true;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">{t('admin.campaigns.title')}</h1>
            <p className="text-muted-foreground">{t('admin.campaigns.subtitle')}</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {t('admin.campaigns.newCampaign')}
          </Button>
        </div>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList>
            <TabsTrigger value="campaigns">
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.campaigns.tabs.campaigns')}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('admin.campaigns.tabs.analytics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6 mt-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
              <p className="text-sm text-muted-foreground">{t('admin.campaigns.total')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">
                {campaigns?.filter(c => c.is_active && isDateActive(c)).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">{t('admin.campaigns.active')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-500">
                {campaigns?.filter(c => c.campaign_type === 'seasonal').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">{t('admin.campaigns.seasonal')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">
                {campaigns?.filter(c => c.campaign_type === 'discount').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">{t('admin.campaigns.discounts')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {campaigns?.map((campaign) => {
            const typeInfo = getTypeInfo(campaign.campaign_type);
            const dateActive = isDateActive(campaign);
            const fullyActive = campaign.is_active && dateActive;
            
            return (
              <Card key={campaign.id} className={!fullyActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className="text-3xl">{campaign.icon}</div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{campaign.name}</h3>
                          <Badge variant={fullyActive ? 'default' : 'secondary'}>
                            {fullyActive ? t('admin.campaigns.activeStatus') : t('admin.campaigns.inactive')}
                          </Badge>
                          <Badge variant="outline">
                            {typeInfo.icon} {typeInfo.label}
                          </Badge>
                          <Badge variant="outline">
                            {getAudienceLabel(campaign.target_audience)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium mt-1">{campaign.title}</p>
                        {campaign.subtitle && (
                          <p className="text-sm text-muted-foreground">{campaign.subtitle}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>CTA: {campaign.cta_text} → {campaign.cta_link}</span>
                          <span>Prioridade: {campaign.priority}</span>
                        </div>
                        
                        {(campaign.start_date || campaign.end_date) && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {campaign.start_date && (
                              <span>Início: {format(new Date(campaign.start_date), 'dd/MM/yyyy HH:mm')}</span>
                            )}
                            {campaign.end_date && (
                              <span>• Fim: {format(new Date(campaign.end_date), 'dd/MM/yyyy HH:mm')}</span>
                            )}
                            {!dateActive && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {t('admin.campaigns.outsidePeriod')}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            icon: campaign.icon,
                            title: campaign.title,
                            subtitle: campaign.subtitle || '',
                            cta_text: campaign.cta_text,
                            bg_gradient: campaign.bg_gradient,
                          });
                          setPreviewOpen(true);
                        }}
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActiveMutation.mutate({ 
                          id: campaign.id, 
                          is_active: !campaign.is_active 
                        })}
                        title={campaign.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {campaign.is_active ? (
                          <PowerOff className="w-4 h-4 text-red-500" />
                        ) : (
                          <Power className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(campaign)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(t('admin.campaigns.deleteConfirm'))) {
                            deleteMutation.mutate(campaign.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Gradient Preview */}
                  <div 
                    className={`mt-3 h-2 rounded-full bg-gradient-to-r ${campaign.bg_gradient}`}
                  />
                </CardContent>
              </Card>
            );
          })}
          
          {campaigns?.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">{t('admin.campaigns.noCampaigns')}</p>
                <Button className="mt-4" onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('admin.campaigns.createFirst')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <CampaignAnalyticsWidget campaigns={campaigns || []} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? t('admin.campaigns.editCampaign') : t('admin.campaigns.newCampaign')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('admin.campaigns.form.internalName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="black_friday_2026"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">{t('admin.campaigns.form.type')}</Label>
                <Select
                  value={formData.campaign_type}
                  onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">{t('admin.campaigns.form.icon')}</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🎉"
                  className="text-center text-xl"
                />
              </div>
              
              <div className="col-span-3 space-y-2">
                <Label htmlFor="title">{t('admin.campaigns.form.titleField')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="🔥 Black Friday!"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">{t('admin.campaigns.form.subtitleField')}</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="50% OFF no Premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cta_text">{t('admin.campaigns.form.buttonText')}</Label>
                <Input
                  id="cta_text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  placeholder="Aproveitar"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cta_link">{t('admin.campaigns.form.buttonLink')}</Label>
                <Input
                  id="cta_link"
                  value={formData.cta_link}
                  onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                  placeholder="/premium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.campaigns.form.backgroundGradient')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {GRADIENT_PRESETS.map((gradient) => (
                  <button
                    key={gradient.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, bg_gradient: gradient.value })}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      formData.bg_gradient === gradient.value 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-muted'
                    }`}
                  >
                    <div className={`h-6 rounded bg-gradient-to-r ${gradient.value}`} />
                    <span className="text-xs mt-1 block">{gradient.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">{t('admin.campaigns.form.targetAudience')}</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_AUDIENCES.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">{t('admin.campaigns.form.priority')}</Label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">{t('admin.campaigns.form.startDate')}</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">{t('admin.campaigns.form.endDate')}</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">{t('admin.campaigns.form.activateCampaign')}</Label>
            </div>

            {/* Preview */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">{t('admin.campaigns.form.bannerPreview')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  className={`flex items-center justify-between w-full h-[60px] px-4 bg-gradient-to-r ${formData.bg_gradient}`}
                >
                  <span className="text-xl shrink-0">{formData.icon}</span>
                  <div className="flex flex-col justify-center py-1 min-w-0 flex-1 ml-3">
                    <span className="text-sm font-medium truncate">{formData.title || 'Título'}</span>
                    {formData.subtitle && (
                      <span className="text-xs text-muted-foreground truncate">{formData.subtitle}</span>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 ml-2">
                    {formData.cta_text || 'CTA'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('admin.campaigns.form.cancel')}
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? t('admin.campaigns.form.saving') : (editingCampaign ? t('admin.campaigns.form.update') : t('admin.campaigns.form.create'))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.campaigns.form.bannerPreview')}</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg overflow-hidden border">
            <div 
              className={`flex items-center justify-between w-full h-[60px] px-4 bg-gradient-to-r ${formData.bg_gradient}`}
            >
              <span className="text-xl shrink-0">{formData.icon}</span>
              <div className="flex flex-col justify-center py-1 min-w-0 flex-1 ml-3">
                <span className="text-sm font-medium truncate">{formData.title}</span>
                {formData.subtitle && (
                  <span className="text-xs text-muted-foreground truncate">{formData.subtitle}</span>
                )}
              </div>
              <Button size="sm" variant="outline" className="shrink-0 ml-2">
                {formData.cta_text}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CampaignsManagement;
