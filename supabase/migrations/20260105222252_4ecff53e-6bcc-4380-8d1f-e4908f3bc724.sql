-- Create trigger to automatically check and complete referral rewards after transaction insert
CREATE OR REPLACE FUNCTION public.check_referral_completion_after_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_validation JSONB;
  v_referral RECORD;
  v_result JSONB;
BEGIN
  -- Check if user has a pending referral
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = NEW.user_id
    AND status = 'pending';
  
  -- No pending referral, nothing to do
  IF v_referral IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Validate if user has met the requirements
  SELECT public.validate_referral_transactions_v2(NEW.user_id) INTO v_validation;
  
  -- If validation passed, complete the referral reward
  IF (v_validation->>'is_valid')::boolean THEN
    SELECT public.complete_referral_reward(NEW.user_id) INTO v_result;
    
    -- Log the completion
    RAISE NOTICE 'Referral reward completed for user %: %', NEW.user_id, v_result;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_check_referral_completion ON public.transactions;

CREATE TRIGGER trigger_check_referral_completion
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_completion_after_transaction();