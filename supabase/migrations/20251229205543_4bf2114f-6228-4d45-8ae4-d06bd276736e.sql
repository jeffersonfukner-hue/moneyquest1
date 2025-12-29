-- =============================================
-- SUPER-ADMIN PANEL - DATABASE STRUCTURE
-- =============================================

-- 1. Create Enum for Roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Create helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- 6. RLS Policies for user_roles
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 7. Trigger to auto-assign super_admin role to specific email
CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'jeffersonfukner@outlook.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_role();

-- 8. Admin Logs table for audit trail
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  action_type text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  details jsonb,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view logs"
  ON public.admin_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create logs"
  ON public.admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 9. User Messages table for internal notifications
CREATE TABLE public.user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  message_type text DEFAULT 'notification',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.user_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON public.user_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can create messages"
  ON public.user_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 10. Message Templates table
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'motivation',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage templates"
  ON public.message_templates FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 11. User Bonuses table
CREATE TABLE public.user_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  granted_by uuid REFERENCES auth.users(id) NOT NULL,
  bonus_type text NOT NULL,
  amount integer NOT NULL,
  note text,
  applied_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bonuses"
  ON public.user_bonuses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage bonuses"
  ON public.user_bonuses FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 12. Add status column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 13. Add constraint for status values (using trigger instead of CHECK for flexibility)
CREATE OR REPLACE FUNCTION public.validate_profile_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'inactive', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status value. Must be active, inactive, or blocked.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_status_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_status();

-- 14. Function to get all profiles for admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

-- 15. Function to get user email by id (for admin panel)
CREATE OR REPLACE FUNCTION public.admin_get_user_email(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  SELECT email INTO user_email FROM auth.users WHERE id = _user_id;
  RETURN user_email;
END;
$$;

-- 16. Function to get admin analytics
CREATE OR REPLACE FUNCTION public.admin_get_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_users integer;
  active_today integer;
  active_7days integer;
  active_30days integer;
  free_users integer;
  premium_users integer;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Total users
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  
  -- Active today
  SELECT COUNT(*) INTO active_today FROM public.profiles 
  WHERE last_active_date = CURRENT_DATE;
  
  -- Active last 7 days
  SELECT COUNT(*) INTO active_7days FROM public.profiles 
  WHERE last_active_date >= CURRENT_DATE - INTERVAL '7 days';
  
  -- Active last 30 days
  SELECT COUNT(*) INTO active_30days FROM public.profiles 
  WHERE last_active_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Free vs Premium
  SELECT COUNT(*) INTO free_users FROM public.profiles 
  WHERE subscription_plan = 'FREE';
  
  SELECT COUNT(*) INTO premium_users FROM public.profiles 
  WHERE subscription_plan = 'PREMIUM';
  
  result := jsonb_build_object(
    'total_users', total_users,
    'active_today', active_today,
    'active_7days', active_7days,
    'active_30days', active_30days,
    'free_users', free_users,
    'premium_users', premium_users,
    'engagement_rate', CASE WHEN total_users > 0 THEN ROUND((active_7days::numeric / total_users) * 100, 1) ELSE 0 END
  );
  
  RETURN result;
END;
$$;

-- 17. Function to get users at risk of abandonment
CREATE OR REPLACE FUNCTION public.admin_get_at_risk_users()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  last_active_date date,
  days_inactive integer,
  risk_level text,
  subscription_plan text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.display_name,
    p.last_active_date,
    COALESCE(CURRENT_DATE - p.last_active_date, 999) as days_inactive,
    CASE 
      WHEN p.last_active_date IS NULL OR CURRENT_DATE - p.last_active_date >= 30 THEN 'high'
      WHEN CURRENT_DATE - p.last_active_date >= 7 THEN 'medium'
      WHEN CURRENT_DATE - p.last_active_date >= 3 THEN 'low'
      ELSE 'none'
    END as risk_level,
    p.subscription_plan
  FROM public.profiles p
  WHERE p.last_active_date IS NULL 
     OR CURRENT_DATE - p.last_active_date >= 3
  ORDER BY days_inactive DESC;
END;
$$;

-- 18. Function to update user subscription (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  _target_user_id uuid,
  _plan text,
  _expires_at timestamptz DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Update the profile
  UPDATE public.profiles
  SET 
    subscription_plan = _plan,
    subscription_started_at = CASE WHEN _plan = 'PREMIUM' THEN now() ELSE subscription_started_at END,
    subscription_expires_at = _expires_at,
    updated_at = now()
  WHERE id = _target_user_id;
  
  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(),
    CASE WHEN _plan = 'PREMIUM' THEN 'PREMIUM_GRANT' ELSE 'PREMIUM_REVOKE' END,
    _target_user_id,
    jsonb_build_object('plan', _plan, 'expires_at', _expires_at),
    _note
  );
END;
$$;

-- 19. Function to update user status (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  _target_user_id uuid,
  _status text,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Update the profile
  UPDATE public.profiles
  SET status = _status, updated_at = now()
  WHERE id = _target_user_id;
  
  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(),
    CASE WHEN _status = 'blocked' THEN 'BLOCK_USER' ELSE 'UNBLOCK_USER' END,
    _target_user_id,
    jsonb_build_object('status', _status),
    _note
  );
END;
$$;

-- 20. Function to grant bonus (admin only)
CREATE OR REPLACE FUNCTION public.admin_grant_bonus(
  _target_user_id uuid,
  _bonus_type text,
  _amount integer,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Record the bonus
  INSERT INTO public.user_bonuses (user_id, granted_by, bonus_type, amount, note)
  VALUES (_target_user_id, auth.uid(), _bonus_type, _amount, _note);
  
  -- Apply the bonus based on type
  IF _bonus_type = 'XP' THEN
    UPDATE public.profiles SET xp = xp + _amount WHERE id = _target_user_id;
  ELSIF _bonus_type = 'PREMIUM_DAYS' THEN
    UPDATE public.profiles 
    SET 
      subscription_plan = 'PREMIUM',
      subscription_started_at = COALESCE(subscription_started_at, now()),
      subscription_expires_at = COALESCE(subscription_expires_at, now()) + (_amount || ' days')::interval
    WHERE id = _target_user_id;
  END IF;
  
  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(),
    'GRANT_BONUS',
    _target_user_id,
    jsonb_build_object('bonus_type', _bonus_type, 'amount', _amount),
    _note
  );
END;
$$;

-- 21. Assign super_admin role to existing user if exists
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'jeffersonfukner@outlook.com';
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;