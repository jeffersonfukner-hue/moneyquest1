-- Monthly Closures table for financial period closing
CREATE TABLE public.monthly_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reopened')),
  
  -- Snapshot data
  total_income NUMERIC NOT NULL DEFAULT 0,
  total_expenses NUMERIC NOT NULL DEFAULT 0,
  net_result NUMERIC NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  cash_adjustment_count INTEGER NOT NULL DEFAULT 0,
  
  -- Wallet balances snapshot (JSON for flexibility)
  wallet_balances JSONB NOT NULL DEFAULT '{}',
  
  -- Closing info
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  closing_notes TEXT,
  
  -- Reopening info
  reopened_at TIMESTAMP WITH TIME ZONE,
  reopened_by UUID,
  reopen_reason TEXT,
  previous_closure_snapshot JSONB, -- Store previous snapshot when reopening
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique period per user
  CONSTRAINT unique_user_period UNIQUE (user_id, period_year, period_month)
);

-- Enable RLS
ALTER TABLE public.monthly_closures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own closures"
ON public.monthly_closures
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own closures"
ON public.monthly_closures
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own closures"
ON public.monthly_closures
FOR UPDATE
USING (auth.uid() = user_id);

-- Audit log for closure actions
CREATE TABLE public.monthly_closure_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  closure_id UUID NOT NULL REFERENCES public.monthly_closures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('close', 'reopen', 'adjust')),
  reason TEXT,
  snapshot_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for audit
ALTER TABLE public.monthly_closure_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON public.monthly_closure_audit
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit logs"
ON public.monthly_closure_audit
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_monthly_closures_user_period ON public.monthly_closures(user_id, period_year, period_month);
CREATE INDEX idx_monthly_closures_status ON public.monthly_closures(status);
CREATE INDEX idx_monthly_closure_audit_closure ON public.monthly_closure_audit(closure_id);

-- Trigger for updated_at
CREATE TRIGGER update_monthly_closures_updated_at
BEFORE UPDATE ON public.monthly_closures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();