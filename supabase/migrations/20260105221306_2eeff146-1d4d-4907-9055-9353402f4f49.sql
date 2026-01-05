-- Create function to reverse XP when a transaction is deleted
CREATE OR REPLACE FUNCTION public.reverse_transaction_xp()
RETURNS TRIGGER AS $$
DECLARE
  current_xp INTEGER;
  new_xp INTEGER;
BEGIN
  -- Only reverse if there was XP earned from this transaction
  IF OLD.xp_earned > 0 THEN
    -- Get current XP
    SELECT xp INTO current_xp FROM public.profiles WHERE id = OLD.user_id;
    
    -- Calculate new XP (don't go below 0)
    new_xp := GREATEST(0, current_xp - OLD.xp_earned);
    
    -- Update user's XP
    UPDATE public.profiles 
    SET xp = new_xp, updated_at = now()
    WHERE id = OLD.user_id;
    
    -- Log the reversal in xp_history
    INSERT INTO public.xp_history (
      user_id,
      xp_change,
      xp_before,
      xp_after,
      source,
      source_id,
      description
    ) VALUES (
      OLD.user_id,
      -OLD.xp_earned,
      current_xp,
      new_xp,
      'transaction_deleted',
      OLD.id,
      'XP revertido: transação excluída (' || OLD.description || ')'
    );
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that fires BEFORE DELETE on transactions
DROP TRIGGER IF EXISTS trigger_reverse_transaction_xp ON public.transactions;

CREATE TRIGGER trigger_reverse_transaction_xp
  BEFORE DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.reverse_transaction_xp();