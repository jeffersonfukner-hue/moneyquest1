-- Block all INSERT operations on exchange_rates (only edge functions with service role should write)
CREATE POLICY "Block manual exchange rate inserts"
  ON public.exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Block all UPDATE operations on exchange_rates
CREATE POLICY "Block manual exchange rate updates"
  ON public.exchange_rates FOR UPDATE
  TO authenticated
  USING (false);

-- Block all DELETE operations on exchange_rates
CREATE POLICY "Block manual exchange rate deletes"
  ON public.exchange_rates FOR DELETE
  TO authenticated
  USING (false);