-- Update existing transactions that have credit_card_id but no invoice_id
DO $$
DECLARE
  tx RECORD;
  v_invoice_id UUID;
BEGIN
  FOR tx IN 
    SELECT id, credit_card_id, date, user_id 
    FROM public.transactions 
    WHERE credit_card_id IS NOT NULL AND invoice_id IS NULL
  LOOP
    SELECT public.get_or_create_current_invoice(
      tx.user_id,
      tx.credit_card_id,
      tx.date
    ) INTO v_invoice_id;
    
    UPDATE public.transactions 
    SET invoice_id = v_invoice_id 
    WHERE id = tx.id;
  END LOOP;
END $$;

-- Update the trigger function with correct parameter order
CREATE OR REPLACE FUNCTION public.assign_invoice_to_card_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  -- Only process if this is a credit card transaction (has credit_card_id)
  IF NEW.credit_card_id IS NOT NULL AND NEW.invoice_id IS NULL THEN
    -- Get or create the current invoice for this credit card and transaction date
    SELECT public.get_or_create_current_invoice(
      NEW.user_id,
      NEW.credit_card_id,
      NEW.date
    ) INTO v_invoice_id;
    
    -- Assign the invoice_id to the transaction
    NEW.invoice_id := v_invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;