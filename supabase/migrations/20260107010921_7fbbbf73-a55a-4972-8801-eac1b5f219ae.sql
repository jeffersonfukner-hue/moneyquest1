-- Create RLS policy for UPDATE on wallet_transfers
CREATE POLICY "Users can update their own transfers" 
ON public.wallet_transfers 
FOR UPDATE 
USING (auth.uid() = user_id);