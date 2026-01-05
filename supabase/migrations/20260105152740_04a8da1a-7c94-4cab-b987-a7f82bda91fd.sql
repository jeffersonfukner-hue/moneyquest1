-- Function to pay credit card invoice (atomic operation)
CREATE OR REPLACE FUNCTION public.pay_credit_card_invoice(
  p_user_id UUID,
  p_invoice_id UUID,
  p_wallet_id UUID,
  p_payment_date DATE DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_card RECORD;
  v_wallet RECORD;
  v_account_transaction_id UUID;
  v_card_transaction_id UUID;
  v_description TEXT;
BEGIN
  -- Get invoice info
  SELECT * INTO v_invoice 
  FROM credit_card_invoices 
  WHERE id = p_invoice_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  
  -- Check if invoice is closed (can only pay closed invoices)
  IF v_invoice.status = 'open' THEN
    RAISE EXCEPTION 'Cannot pay an open invoice. Close it first.';
  END IF;
  
  IF v_invoice.status = 'paid' THEN
    RAISE EXCEPTION 'Invoice already paid';
  END IF;
  
  -- Get card info
  SELECT * INTO v_card 
  FROM credit_cards 
  WHERE id = v_invoice.credit_card_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit card not found';
  END IF;
  
  -- Get wallet info
  SELECT * INTO v_wallet 
  FROM wallets 
  WHERE id = p_wallet_id AND user_id = p_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found or inactive';
  END IF;
  
  -- Check if wallet has sufficient balance
  IF v_wallet.current_balance < v_invoice.total_amount THEN
    RAISE EXCEPTION 'Insufficient balance in wallet';
  END IF;
  
  -- Build description
  v_description := 'Pagamento fatura ' || v_card.name;
  
  -- 1) Create DEBIT transaction on the ACCOUNT
  INSERT INTO transactions (
    user_id, description, amount, category, type, date, 
    wallet_id, currency, source_type, transaction_subtype, is_manual,
    xp_earned
  ) VALUES (
    p_user_id, v_description, v_invoice.total_amount, 'Cartão de Crédito', 'EXPENSE', p_payment_date,
    p_wallet_id, v_wallet.currency, 'account', 'debit', false,
    0  -- No XP for automatic transactions
  )
  RETURNING id INTO v_account_transaction_id;
  
  -- 2) Create PAYMENT transaction on the CARD
  INSERT INTO transactions (
    user_id, description, amount, category, type, date,
    credit_card_id, currency, source_type, transaction_subtype, is_manual,
    invoice_id, xp_earned
  ) VALUES (
    p_user_id, v_description, v_invoice.total_amount, 'Cartão de Crédito', 'EXPENSE', p_payment_date,
    v_invoice.credit_card_id, v_card.currency, 'card', 'invoice_payment', false,
    p_invoice_id, 0
  )
  RETURNING id INTO v_card_transaction_id;
  
  -- 3) Update wallet balance (decrease)
  UPDATE wallets
  SET current_balance = current_balance - v_invoice.total_amount,
      updated_at = now()
  WHERE id = p_wallet_id;
  
  -- 4) Update card available limit (restore)
  UPDATE credit_cards
  SET available_limit = available_limit + v_invoice.total_amount,
      updated_at = now()
  WHERE id = v_invoice.credit_card_id;
  
  -- 5) Mark invoice as paid
  UPDATE credit_card_invoices
  SET status = 'paid',
      paid_at = now(),
      updated_at = now()
  WHERE id = p_invoice_id;
  
  -- Return success info
  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'amount_paid', v_invoice.total_amount,
    'wallet_transaction_id', v_account_transaction_id,
    'card_transaction_id', v_card_transaction_id,
    'card_name', v_card.name,
    'wallet_name', v_wallet.name
  );
END;
$$;

-- Function to close an invoice (change from open to closed)
CREATE OR REPLACE FUNCTION public.close_credit_card_invoice(
  p_user_id UUID,
  p_invoice_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_total NUMERIC;
BEGIN
  -- Get invoice
  SELECT * INTO v_invoice 
  FROM credit_card_invoices 
  WHERE id = p_invoice_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  
  IF v_invoice.status != 'open' THEN
    RAISE EXCEPTION 'Invoice is not open';
  END IF;
  
  -- Recalculate total from transactions
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM transactions
  WHERE invoice_id = p_invoice_id
    AND transaction_subtype = 'card_expense';
  
  -- Update invoice
  UPDATE credit_card_invoices
  SET status = 'closed',
      total_amount = v_total,
      closed_at = now(),
      updated_at = now()
  WHERE id = p_invoice_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'total_amount', v_total,
    'status', 'closed'
  );
END;
$$;

-- Trigger to update card limit when card expense is added
CREATE OR REPLACE FUNCTION public.handle_card_expense_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only handle card expenses
  IF NEW.source_type = 'card' AND NEW.transaction_subtype = 'card_expense' AND NEW.credit_card_id IS NOT NULL THEN
    -- Reduce available limit
    UPDATE credit_cards
    SET available_limit = available_limit - NEW.amount,
        updated_at = now()
    WHERE id = NEW.credit_card_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_card_expense_limit
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_card_expense_limit();

-- Trigger to restore limit when card expense is deleted
CREATE OR REPLACE FUNCTION public.handle_card_expense_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only handle card expenses
  IF OLD.source_type = 'card' AND OLD.transaction_subtype = 'card_expense' AND OLD.credit_card_id IS NOT NULL THEN
    -- Restore available limit
    UPDATE credit_cards
    SET available_limit = available_limit + OLD.amount,
        updated_at = now()
    WHERE id = OLD.credit_card_id;
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_card_expense_delete
AFTER DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_card_expense_delete();