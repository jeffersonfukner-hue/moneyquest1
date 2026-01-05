-- Create credit_card_invoices table
CREATE TABLE public.credit_card_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
  closed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Enable RLS
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own invoices"
ON public.credit_card_invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoices"
ON public.credit_card_invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
ON public.credit_card_invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
ON public.credit_card_invoices FOR DELETE
USING (auth.uid() = user_id);

-- Add invoice reference to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_invoices_credit_card_id ON public.credit_card_invoices(credit_card_id);
CREATE INDEX idx_invoices_status ON public.credit_card_invoices(status);
CREATE INDEX idx_invoices_period ON public.credit_card_invoices(period_start, period_end);
CREATE INDEX idx_transactions_invoice_id ON public.transactions(invoice_id);

-- Trigger for updated_at
CREATE TRIGGER update_credit_card_invoices_updated_at
BEFORE UPDATE ON public.credit_card_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get or create current invoice for a card
CREATE OR REPLACE FUNCTION public.get_or_create_current_invoice(
  p_user_id UUID,
  p_credit_card_id UUID,
  p_transaction_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card RECORD;
  v_invoice_id UUID;
  v_period_start DATE;
  v_period_end DATE;
  v_due_date DATE;
BEGIN
  -- Get card info
  SELECT * INTO v_card FROM credit_cards WHERE id = p_credit_card_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found';
  END IF;
  
  -- Calculate period based on billing_close_day
  IF EXTRACT(DAY FROM p_transaction_date) <= v_card.billing_close_day THEN
    -- Current month's invoice
    v_period_start := DATE_TRUNC('month', p_transaction_date) + ((v_card.billing_close_day - 1) || ' days')::INTERVAL - INTERVAL '1 month' + INTERVAL '1 day';
    v_period_end := DATE_TRUNC('month', p_transaction_date) + ((v_card.billing_close_day - 1) || ' days')::INTERVAL;
  ELSE
    -- Next month's invoice
    v_period_start := DATE_TRUNC('month', p_transaction_date) + ((v_card.billing_close_day) || ' days')::INTERVAL;
    v_period_end := DATE_TRUNC('month', p_transaction_date) + INTERVAL '1 month' + ((v_card.billing_close_day - 1) || ' days')::INTERVAL;
  END IF;
  
  -- Calculate due date
  v_due_date := DATE_TRUNC('month', v_period_end) + INTERVAL '1 month' + ((v_card.due_day - 1) || ' days')::INTERVAL;
  
  -- Try to find existing open invoice for this period
  SELECT id INTO v_invoice_id
  FROM credit_card_invoices
  WHERE credit_card_id = p_credit_card_id
    AND user_id = p_user_id
    AND period_start = v_period_start
    AND period_end = v_period_end
    AND status = 'open';
  
  -- If not found, create new invoice
  IF v_invoice_id IS NULL THEN
    INSERT INTO credit_card_invoices (user_id, credit_card_id, period_start, period_end, due_date, status)
    VALUES (p_user_id, p_credit_card_id, v_period_start, v_period_end, v_due_date, 'open')
    RETURNING id INTO v_invoice_id;
  END IF;
  
  RETURN v_invoice_id;
END;
$$;

-- Function to recalculate invoice total
CREATE OR REPLACE FUNCTION public.recalculate_invoice_total(p_invoice_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM transactions
  WHERE invoice_id = p_invoice_id
    AND transaction_subtype = 'card_expense';
  
  UPDATE credit_card_invoices
  SET total_amount = v_total, updated_at = now()
  WHERE id = p_invoice_id;
  
  RETURN v_total;
END;
$$;