-- Create internal_campaigns table for managing promotional banners
CREATE TABLE public.internal_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('seasonal', 'promo', 'discount', 'feature')),
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_text TEXT NOT NULL,
  cta_link TEXT NOT NULL,
  icon TEXT DEFAULT '🎉',
  bg_gradient TEXT DEFAULT 'from-primary/20 via-primary/15 to-primary/20',
  text_color TEXT DEFAULT 'text-foreground',
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'premium', 'trial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.internal_campaigns ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage campaigns
CREATE POLICY "Super admins can manage campaigns"
  ON public.internal_campaigns
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- All authenticated users can read active campaigns
CREATE POLICY "Users can read active campaigns"
  ON public.internal_campaigns
  FOR SELECT
  USING (is_active = true);

-- Create function to get active campaigns
CREATE OR REPLACE FUNCTION public.get_active_campaigns(p_audience TEXT DEFAULT 'all')
RETURNS SETOF public.internal_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.internal_campaigns
  WHERE is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
    AND (target_audience = 'all' OR target_audience = p_audience)
  ORDER BY priority DESC, created_at DESC;
END;
$$;

-- Create function for admins to create/update campaigns
CREATE OR REPLACE FUNCTION public.admin_upsert_campaign(
  p_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_campaign_type TEXT DEFAULT 'promo',
  p_title TEXT DEFAULT NULL,
  p_subtitle TEXT DEFAULT NULL,
  p_cta_text TEXT DEFAULT NULL,
  p_cta_link TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT '🎉',
  p_bg_gradient TEXT DEFAULT 'from-primary/20 via-primary/15 to-primary/20',
  p_priority INTEGER DEFAULT 50,
  p_is_active BOOLEAN DEFAULT true,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_target_audience TEXT DEFAULT 'all'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.internal_campaigns
    SET
      name = COALESCE(p_name, name),
      campaign_type = COALESCE(p_campaign_type, campaign_type),
      title = COALESCE(p_title, title),
      subtitle = COALESCE(p_subtitle, subtitle),
      cta_text = COALESCE(p_cta_text, cta_text),
      cta_link = COALESCE(p_cta_link, cta_link),
      icon = COALESCE(p_icon, icon),
      bg_gradient = COALESCE(p_bg_gradient, bg_gradient),
      priority = COALESCE(p_priority, priority),
      is_active = COALESCE(p_is_active, is_active),
      start_date = p_start_date,
      end_date = p_end_date,
      target_audience = COALESCE(p_target_audience, target_audience),
      updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;
  ELSE
    -- Create new
    INSERT INTO public.internal_campaigns (
      name, campaign_type, title, subtitle, cta_text, cta_link,
      icon, bg_gradient, priority, is_active, start_date, end_date,
      target_audience, created_by
    )
    VALUES (
      p_name, p_campaign_type, p_title, p_subtitle, p_cta_text, p_cta_link,
      p_icon, p_bg_gradient, p_priority, p_is_active, p_start_date, p_end_date,
      p_target_audience, auth.uid()
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- Insert default seasonal campaigns (inactive by default)
INSERT INTO public.internal_campaigns (name, campaign_type, title, subtitle, cta_text, cta_link, icon, bg_gradient, is_active, start_date, end_date, target_audience) VALUES
  ('black_friday_2026', 'discount', '🔥 Black Friday!', '50% OFF no Premium', 'Aproveitar', '/premium', '🔥', 'from-orange-500/30 via-red-500/20 to-orange-500/30', false, '2026-11-20 00:00:00+00', '2026-11-30 23:59:59+00', 'free'),
  ('christmas_2026', 'seasonal', '🎄 Feliz Natal!', 'Presente especial pra você', 'Ver Oferta', '/premium', '🎄', 'from-green-500/30 via-red-500/20 to-green-500/30', false, '2026-12-15 00:00:00+00', '2026-12-26 23:59:59+00', 'all'),
  ('new_year_2027', 'seasonal', '🎆 Ano Novo!', 'Comece 2027 no controle', 'Começar Agora', '/premium', '🎆', 'from-purple-500/30 via-blue-500/20 to-purple-500/30', false, '2026-12-27 00:00:00+00', '2027-01-07 23:59:59+00', 'all'),
  ('carnival_2026', 'seasonal', '🎭 Carnaval!', 'Economize na folia', 'Dicas Grátis', '/ai-coach', '🎭', 'from-yellow-500/30 via-green-500/20 to-yellow-500/30', false, NULL, NULL, 'all');