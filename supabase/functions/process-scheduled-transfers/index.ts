import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledTransfer {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  currency: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  next_run_date: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    // Get all scheduled transfers due today
    const { data: scheduledTransfers, error: fetchError } = await supabase
      .from('scheduled_transfers')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_date', today);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${scheduledTransfers?.length || 0} scheduled transfers to process`);

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const transfer of (scheduledTransfers || []) as ScheduledTransfer[]) {
      try {
        // Get wallet balances
        const { data: fromWallet, error: fromError } = await supabase
          .from('wallets')
          .select('current_balance, currency')
          .eq('id', transfer.from_wallet_id)
          .single();

        if (fromError || !fromWallet) {
          throw new Error(`Source wallet not found: ${transfer.from_wallet_id}`);
        }

        const { data: toWallet, error: toError } = await supabase
          .from('wallets')
          .select('current_balance, currency')
          .eq('id', transfer.to_wallet_id)
          .single();

        if (toError || !toWallet) {
          throw new Error(`Destination wallet not found: ${transfer.to_wallet_id}`);
        }

        // Calculate converted amount if currencies differ
        let amountToAdd = transfer.amount;
        if (fromWallet.currency !== toWallet.currency) {
          const { data: rate } = await supabase
            .from('exchange_rates')
            .select('rate')
            .eq('base_currency', fromWallet.currency)
            .eq('target_currency', toWallet.currency)
            .single();

          if (rate) {
            amountToAdd = Number((transfer.amount * rate.rate).toFixed(2));
          }
        }

        // Create transfer record
        const { error: insertError } = await supabase
          .from('wallet_transfers')
          .insert({
            user_id: transfer.user_id,
            from_wallet_id: transfer.from_wallet_id,
            to_wallet_id: transfer.to_wallet_id,
            amount: transfer.amount,
            currency: transfer.currency,
            description: transfer.description ? `[Auto] ${transfer.description}` : '[Auto] Transferência agendada',
            date: today,
          });

        if (insertError) throw insertError;

        // Update source wallet
        const { error: updateFromError } = await supabase
          .from('wallets')
          .update({ 
            current_balance: fromWallet.current_balance - transfer.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', transfer.from_wallet_id);

        if (updateFromError) throw updateFromError;

        // Update destination wallet
        const { error: updateToError } = await supabase
          .from('wallets')
          .update({ 
            current_balance: toWallet.current_balance + amountToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('id', transfer.to_wallet_id);

        if (updateToError) throw updateToError;

        // Calculate next run date
        const nextDate = new Date(transfer.next_run_date);
        if (transfer.frequency === 'daily') {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (transfer.frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (transfer.frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Update scheduled transfer
        const { error: updateScheduleError } = await supabase
          .from('scheduled_transfers')
          .update({
            last_run_date: today,
            next_run_date: nextDate.toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('id', transfer.id);

        if (updateScheduleError) throw updateScheduleError;

        results.processed++;
        console.log(`Processed transfer ${transfer.id}`);
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Transfer ${transfer.id}: ${errorMessage}`);
        console.error(`Failed to process transfer ${transfer.id}:`, error);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing scheduled transfers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
