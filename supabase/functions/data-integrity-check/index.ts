import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntegrityIssue {
  type: string;
  severity: 'warning' | 'error';
  count: number;
  details: string;
  affectedIds?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting data integrity check...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const issues: IntegrityIssue[] = [];
    const fixes: string[] = [];

    // 1. Check for orphan transactions (transactions with categories that don't exist)
    console.log('Checking for orphan transactions...');
    const { data: orphanExpenseTransactions, error: orphanExpenseError } = await supabase
      .rpc('check_orphan_expense_transactions');
    
    if (orphanExpenseError) {
      console.log('RPC not available, using direct query approach');
      
      // Get all transactions with their categories
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('id, user_id, category, type');
      
      // Get all categories
      const { data: allCategories } = await supabase
        .from('categories')
        .select('user_id, name, type');
      
      if (allTransactions && allCategories) {
        const categorySet = new Set(
          allCategories.map(c => `${c.user_id}|${c.name}|${c.type}`)
        );
        
        const orphanTx = allTransactions.filter(
          t => !categorySet.has(`${t.user_id}|${t.category}|${t.type}`)
        );
        
        if (orphanTx.length > 0) {
          issues.push({
            type: 'orphan_transactions',
            severity: 'warning',
            count: orphanTx.length,
            details: `Found ${orphanTx.length} transactions with categories that don't exist`,
            affectedIds: orphanTx.slice(0, 10).map(t => t.id)
          });
        }
      }
    }

    // 2. Check for orphan category goals
    console.log('Checking for orphan category goals...');
    const { data: allGoals } = await supabase
      .from('category_goals')
      .select('id, user_id, category');
    
    const { data: allCategoriesForGoals } = await supabase
      .from('categories')
      .select('user_id, name, type')
      .eq('type', 'EXPENSE');
    
    if (allGoals && allCategoriesForGoals) {
      const expenseCategorySet = new Set(
        allCategoriesForGoals.map(c => `${c.user_id}|${c.name}`)
      );
      
      const orphanGoals = allGoals.filter(
        g => !expenseCategorySet.has(`${g.user_id}|${g.category}`)
      );
      
      if (orphanGoals.length > 0) {
        issues.push({
          type: 'orphan_goals',
          severity: 'warning',
          count: orphanGoals.length,
          details: `Found ${orphanGoals.length} category goals without corresponding categories`,
          affectedIds: orphanGoals.slice(0, 10).map(g => g.id)
        });
      }
    }

    // 3. Check for transactions without wallet_id
    console.log('Checking for transactions without wallet...');
    const { data: noWalletTransactions, count: noWalletCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .is('wallet_id', null);
    
    if (noWalletCount && noWalletCount > 0) {
      issues.push({
        type: 'transactions_without_wallet',
        severity: 'warning',
        count: noWalletCount,
        details: `Found ${noWalletCount} transactions without assigned wallet`,
        affectedIds: noWalletTransactions?.slice(0, 10).map(t => t.id)
      });
    }

    // 4. Check for duplicate categories
    console.log('Checking for duplicate categories...');
    const { data: categories } = await supabase
      .from('categories')
      .select('id, user_id, name, type');
    
    if (categories) {
      const categoryGroups = new Map<string, typeof categories>();
      
      categories.forEach(cat => {
        const key = `${cat.user_id}|${cat.name}|${cat.type}`;
        if (!categoryGroups.has(key)) {
          categoryGroups.set(key, []);
        }
        categoryGroups.get(key)!.push(cat);
      });
      
      const duplicates = Array.from(categoryGroups.entries())
        .filter(([, cats]) => cats.length > 1);
      
      if (duplicates.length > 0) {
        const totalDuplicates = duplicates.reduce((sum, [, cats]) => sum + cats.length - 1, 0);
        issues.push({
          type: 'duplicate_categories',
          severity: 'error',
          count: totalDuplicates,
          details: `Found ${totalDuplicates} duplicate categories across ${duplicates.length} groups`,
          affectedIds: duplicates.flatMap(([, cats]) => cats.slice(1).map(c => c.id))
        });
      }
    }

    // 5. Check for profiles without categories
    console.log('Checking for profiles without categories...');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id');
    
    const { data: usersWithCategories } = await supabase
      .from('categories')
      .select('user_id')
      .limit(1000);
    
    if (profiles && usersWithCategories) {
      const usersWithCatsSet = new Set(usersWithCategories.map(c => c.user_id));
      const profilesWithoutCats = profiles.filter(p => !usersWithCatsSet.has(p.id));
      
      if (profilesWithoutCats.length > 0) {
        issues.push({
          type: 'profiles_without_categories',
          severity: 'error',
          count: profilesWithoutCats.length,
          details: `Found ${profilesWithoutCats.length} user profiles without any categories`,
          affectedIds: profilesWithoutCats.slice(0, 10).map(p => p.id)
        });
        
        // Auto-fix: provision categories for these users
        for (const profile of profilesWithoutCats) {
          console.log(`Auto-provisioning categories for user ${profile.id}`);
          const { error: provisionError } = await supabase
            .rpc('create_default_categories', { p_user_id: profile.id });
          
          if (!provisionError) {
            fixes.push(`Provisioned default categories for user ${profile.id}`);
          }
        }
      }
    }

    // 6. Check for wallets with incorrect balance
    console.log('Checking wallet balance consistency...');
    const { data: wallets } = await supabase
      .from('wallets')
      .select('id, user_id, name, initial_balance, current_balance');
    
    if (wallets) {
      for (const wallet of wallets.slice(0, 50)) { // Limit to 50 wallets per run
        const { data: walletTransactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('wallet_id', wallet.id);
        
        if (walletTransactions) {
          let calculatedBalance = Number(wallet.initial_balance);
          
          walletTransactions.forEach(tx => {
            if (tx.type === 'INCOME') {
              calculatedBalance += Number(tx.amount);
            } else {
              calculatedBalance -= Number(tx.amount);
            }
          });
          
          const difference = Math.abs(Number(wallet.current_balance) - calculatedBalance);
          
          if (difference > 0.01) { // Allow for floating point errors
            issues.push({
              type: 'wallet_balance_mismatch',
              severity: 'error',
              count: 1,
              details: `Wallet "${wallet.name}" has incorrect balance. Expected: ${calculatedBalance.toFixed(2)}, Actual: ${wallet.current_balance}`,
              affectedIds: [wallet.id]
            });
          }
        }
      }
    }

    // Log results
    const summary = {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      totalAffected: issues.reduce((sum, i) => sum + i.count, 0),
      autoFixes: fixes.length,
      issues,
      fixes
    };

    console.log('Data integrity check completed:', JSON.stringify(summary, null, 2));

    // Store the check result in admin notifications if there are issues
    if (issues.length > 0) {
      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert({
          notification_type: 'data_integrity',
          title: `Data Integrity Check: ${issues.length} issues found`,
          message: `Found ${summary.totalAffected} data inconsistencies across ${issues.length} categories`,
          severity: issues.some(i => i.severity === 'error') ? 'error' : 'warning',
          metadata: summary
        });
      
      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Data integrity check failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
