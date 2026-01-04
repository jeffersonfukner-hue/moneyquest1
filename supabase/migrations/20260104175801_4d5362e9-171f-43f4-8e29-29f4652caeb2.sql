-- Table to track daily transaction XP limits per user
CREATE TABLE public.daily_transaction_xp_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transactions_with_xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, transaction_date)
);

-- Enable RLS
ALTER TABLE public.daily_transaction_xp_limits ENABLE ROW LEVEL SECURITY;

-- Users can read their own limits
CREATE POLICY "Users can view their own daily limits"
ON public.daily_transaction_xp_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_daily_transaction_xp_limits_user_date 
ON public.daily_transaction_xp_limits(user_id, transaction_date);

-- Function to check and increment daily transaction XP limit
-- Returns: { can_earn_xp: boolean, current_count: number, limit: number }
CREATE OR REPLACE FUNCTION public.check_transaction_xp_limit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_timezone TEXT;
    v_today DATE;
    v_current_count INTEGER;
    v_limit INTEGER := 15;
    v_can_earn BOOLEAN;
    v_record_exists BOOLEAN;
BEGIN
    -- Get user's timezone from profile
    SELECT timezone INTO v_user_timezone
    FROM profiles
    WHERE id = p_user_id;
    
    -- Default to UTC if not set
    IF v_user_timezone IS NULL THEN
        v_user_timezone := 'UTC';
    END IF;
    
    -- Get today's date in user's timezone
    v_today := (NOW() AT TIME ZONE v_user_timezone)::DATE;
    
    -- Check if record exists for today
    SELECT transactions_with_xp, TRUE INTO v_current_count, v_record_exists
    FROM daily_transaction_xp_limits
    WHERE user_id = p_user_id AND transaction_date = v_today;
    
    IF NOT FOUND THEN
        v_current_count := 0;
        v_record_exists := FALSE;
    END IF;
    
    -- Check if user can earn XP
    v_can_earn := v_current_count < v_limit;
    
    IF v_can_earn THEN
        -- Increment counter (upsert)
        INSERT INTO daily_transaction_xp_limits (user_id, transaction_date, transactions_with_xp, updated_at)
        VALUES (p_user_id, v_today, 1, now())
        ON CONFLICT (user_id, transaction_date)
        DO UPDATE SET 
            transactions_with_xp = daily_transaction_xp_limits.transactions_with_xp + 1,
            updated_at = now();
            
        v_current_count := v_current_count + 1;
    ELSE
        -- Log that limit was reached (insert into xp_history with 0 change)
        INSERT INTO xp_history (user_id, xp_change, xp_before, xp_after, source, description)
        SELECT 
            p_user_id,
            0,
            xp,
            xp,
            'transaction_limit_reached',
            'daily_transaction_xp_limit_reached'
        FROM profiles WHERE id = p_user_id;
    END IF;
    
    RETURN json_build_object(
        'can_earn_xp', v_can_earn,
        'current_count', v_current_count,
        'limit', v_limit
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_transaction_xp_limit(UUID) TO authenticated;