import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BACKUP_VERSION = '1.0';
const MAX_BACKUPS_PER_USER = 30;

interface BackupData {
  version: string;
  exportedAt: string;
  userId: string;
  data: {
    transactions: any[];
    wallets: any[];
    categories: any[];
    categoryGoals: any[];
    creditCards: any[];
    creditCardInvoices: any[];
    loans: any[];
    transactionTemplates: any[];
    walletTransfers: any[];
    suppliers: any[];
    personalRewards: any[];
    scheduledTransactions: any[];
  };
}

async function generateBackupForUser(supabase: any, userId: string): Promise<BackupData> {
  const [
    transactionsRes,
    walletsRes,
    categoriesRes,
    categoryGoalsRes,
    creditCardsRes,
    creditCardInvoicesRes,
    loansRes,
    templatesRes,
    transfersRes,
    suppliersRes,
    rewardsRes,
    scheduledRes,
  ] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', userId),
    supabase.from('wallets').select('*').eq('user_id', userId),
    supabase.from('categories').select('*').eq('user_id', userId).eq('is_default', false),
    supabase.from('category_goals').select('*').eq('user_id', userId),
    supabase.from('credit_cards').select('*').eq('user_id', userId),
    supabase.from('credit_card_invoices').select('*').eq('user_id', userId),
    supabase.from('loans').select('*').eq('user_id', userId),
    supabase.from('transaction_templates').select('*').eq('user_id', userId),
    supabase.from('wallet_transfers').select('*').eq('user_id', userId),
    supabase.from('suppliers').select('*').eq('user_id', userId),
    supabase.from('personal_rewards').select('*').eq('user_id', userId),
    supabase.from('scheduled_transactions').select('*').eq('user_id', userId),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    userId: userId,
    data: {
      transactions: transactionsRes.data || [],
      wallets: walletsRes.data || [],
      categories: categoriesRes.data || [],
      categoryGoals: categoryGoalsRes.data || [],
      creditCards: creditCardsRes.data || [],
      creditCardInvoices: creditCardInvoicesRes.data || [],
      loans: loansRes.data || [],
      transactionTemplates: templatesRes.data || [],
      walletTransfers: transfersRes.data || [],
      suppliers: suppliersRes.data || [],
      personalRewards: rewardsRes.data || [],
      scheduledTransactions: scheduledRes.data || [],
    },
  };
}

async function cleanupOldBackups(supabase: any, userId: string): Promise<number> {
  // Get all backups for this user, ordered by date
  const { data: backups, error } = await supabase
    .from('user_backups')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !backups) {
    console.error(`Error fetching backups for user ${userId}:`, error);
    return 0;
  }

  // If we have more than MAX_BACKUPS_PER_USER, delete the oldest ones
  if (backups.length >= MAX_BACKUPS_PER_USER) {
    const backupsToDelete = backups.slice(MAX_BACKUPS_PER_USER - 1); // Keep MAX-1 to make room for new one
    const idsToDelete = backupsToDelete.map((b: any) => b.id);

    const { error: deleteError } = await supabase
      .from('user_backups')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error(`Error deleting old backups for user ${userId}:`, deleteError);
      return 0;
    }

    console.log(`Deleted ${idsToDelete.length} old backups for user ${userId}`);
    return idsToDelete.length;
  }

  return 0;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role to access all users
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting automatic backup process...');

    // Get all active users (users who have logged in recently or have transactions)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .not('last_active_date', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} active users to backup`);

    const results = {
      success: 0,
      failed: 0,
      cleaned: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const profile of profiles || []) {
      try {
        const userId = profile.id;

        // First, cleanup old backups (keep only last 30)
        const deletedCount = await cleanupOldBackups(supabase, userId);
        results.cleaned += deletedCount;

        // Generate backup data
        const backupData = await generateBackupForUser(supabase, userId);

        // Calculate file size
        const jsonString = JSON.stringify(backupData);
        const fileSize = new Blob([jsonString]).size;

        // Format date for backup name
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        // Save backup
        const { error: insertError } = await supabase
          .from('user_backups')
          .insert({
            user_id: userId,
            name: `Backup Automático - ${dateStr}`,
            backup_data: backupData,
            file_size: fileSize,
          });

        if (insertError) {
          console.error(`Error saving backup for user ${userId}:`, insertError);
          results.failed++;
          results.errors.push(`User ${userId}: ${insertError.message}`);
        } else {
          console.log(`Backup saved successfully for user ${userId}`);
          results.success++;
        }
      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        results.failed++;
        results.errors.push(`User ${profile.id}: ${String(userError)}`);
      }
    }

    console.log('Automatic backup process completed:', results);

    return new Response(
      JSON.stringify({
        message: 'Automatic backup completed',
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Auto-backup error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
