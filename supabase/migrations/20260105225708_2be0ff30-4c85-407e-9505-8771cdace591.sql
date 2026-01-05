-- Create function to initialize loan badges for a user
CREATE OR REPLACE FUNCTION public.initialize_loan_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has loan badges
  IF EXISTS (
    SELECT 1 FROM public.badges 
    WHERE user_id = p_user_id 
    AND name IN ('Debt Killer', 'Zero Late Payments', 'Interest Under Control')
  ) THEN
    RETURN;
  END IF;

  -- Insert loan-related badges
  INSERT INTO public.badges (user_id, name, description, icon, requirement_type, requirement_value, is_unlocked)
  VALUES
    (p_user_id, 'Debt Killer', 'Quitou um empréstimo por completo', '💀', 'LOAN_PAYOFF', 1, false),
    (p_user_id, 'Zero Late Payments', 'Pagou 12 parcelas consecutivas em dia', '🎯', 'LOAN_ON_TIME', 12, false),
    (p_user_id, 'Interest Under Control', 'Manteve empréstimos abaixo de 20% da renda', '📊', 'LOAN_CONTROL', 3, false)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Create function to check and unlock loan badges
CREATE OR REPLACE FUNCTION public.check_loan_badges(p_user_id UUID)
RETURNS TABLE(badge_name TEXT, badge_icon TEXT, unlocked BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid_loans INTEGER;
  v_on_time_payments INTEGER;
  v_badge RECORD;
BEGIN
  -- First ensure badges exist
  PERFORM public.initialize_loan_badges(p_user_id);

  -- Count fully paid loans
  SELECT COUNT(*) INTO v_paid_loans
  FROM public.loans
  WHERE user_id = p_user_id AND status = 'quitado';

  -- For simplicity, count total paid installments as proxy for on-time payments
  SELECT COALESCE(SUM(parcelas_pagas), 0) INTO v_on_time_payments
  FROM public.loans
  WHERE user_id = p_user_id;

  -- Check each loan badge
  FOR v_badge IN 
    SELECT id, name, icon, requirement_type, requirement_value, is_unlocked
    FROM public.badges
    WHERE user_id = p_user_id 
    AND requirement_type IN ('LOAN_PAYOFF', 'LOAN_ON_TIME', 'LOAN_CONTROL')
    AND is_unlocked = false
  LOOP
    CASE v_badge.requirement_type
      WHEN 'LOAN_PAYOFF' THEN
        IF v_paid_loans >= v_badge.requirement_value THEN
          UPDATE public.badges 
          SET is_unlocked = true, unlocked_at = NOW() 
          WHERE id = v_badge.id;
          
          RETURN QUERY SELECT v_badge.name, v_badge.icon, true;
        END IF;
      
      WHEN 'LOAN_ON_TIME' THEN
        IF v_on_time_payments >= v_badge.requirement_value THEN
          UPDATE public.badges 
          SET is_unlocked = true, unlocked_at = NOW() 
          WHERE id = v_badge.id;
          
          RETURN QUERY SELECT v_badge.name, v_badge.icon, true;
        END IF;
      
      WHEN 'LOAN_CONTROL' THEN
        -- This badge is checked based on budget alert status (handled in app)
        NULL;
    END CASE;
  END LOOP;

  RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.initialize_loan_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_loan_badges(UUID) TO authenticated;