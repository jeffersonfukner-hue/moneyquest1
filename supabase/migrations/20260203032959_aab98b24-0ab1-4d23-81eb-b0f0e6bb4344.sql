-- =============================================
-- Bank Statement Lines (imported from bank)
-- =============================================
CREATE TABLE public.bank_statement_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  
  -- Bank data
  bank_reference VARCHAR(100), -- ID/código do banco
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  counterparty TEXT, -- contraparte
  amount NUMERIC(12,2) NOT NULL, -- positive for income, negative for expense
  
  -- Import metadata
  import_batch_id UUID, -- to group imports
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_file_name TEXT,
  
  -- Reconciliation status
  reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (reconciliation_status IN ('pending', 'reconciled', 'ignored', 'created')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- Reconciliation Records (link bank line to transaction)
-- =============================================
CREATE TABLE public.reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Links
  bank_line_id UUID NOT NULL REFERENCES public.bank_statement_lines(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  
  -- Match metadata
  match_type VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (match_type IN ('auto', 'manual', 'created')),
  confidence_score NUMERIC(5,2), -- 0-100 for auto matches
  
  -- Audit
  reconciled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reconciled_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_bank_statement_lines_user_wallet 
  ON public.bank_statement_lines(user_id, wallet_id);
CREATE INDEX idx_bank_statement_lines_status 
  ON public.bank_statement_lines(reconciliation_status);
CREATE INDEX idx_bank_statement_lines_date 
  ON public.bank_statement_lines(transaction_date);
CREATE INDEX idx_bank_statement_lines_batch 
  ON public.bank_statement_lines(import_batch_id);

CREATE INDEX idx_reconciliations_user 
  ON public.reconciliations(user_id);
CREATE INDEX idx_reconciliations_bank_line 
  ON public.reconciliations(bank_line_id);
CREATE INDEX idx_reconciliations_transaction 
  ON public.reconciliations(transaction_id);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for bank_statement_lines
-- =============================================
CREATE POLICY "Users can view their own bank lines"
  ON public.bank_statement_lines
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank lines"
  ON public.bank_statement_lines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank lines"
  ON public.bank_statement_lines
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank lines"
  ON public.bank_statement_lines
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies for reconciliations
-- =============================================
CREATE POLICY "Users can view their own reconciliations"
  ON public.reconciliations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reconciliations"
  ON public.reconciliations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reconciliations"
  ON public.reconciliations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reconciliations"
  ON public.reconciliations
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Trigger for updated_at
-- =============================================
CREATE TRIGGER update_bank_statement_lines_updated_at
  BEFORE UPDATE ON public.bank_statement_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();