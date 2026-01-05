-- Block all INSERT operations on daily_transaction_xp_limits (only system functions with service role should write)
CREATE POLICY "Block manual XP limit inserts"
  ON public.daily_transaction_xp_limits FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Block all UPDATE operations on daily_transaction_xp_limits
CREATE POLICY "Block manual XP limit updates"
  ON public.daily_transaction_xp_limits FOR UPDATE
  TO authenticated
  USING (false);

-- Block all DELETE operations on daily_transaction_xp_limits
CREATE POLICY "Block manual XP limit deletes"
  ON public.daily_transaction_xp_limits FOR DELETE
  TO authenticated
  USING (false);