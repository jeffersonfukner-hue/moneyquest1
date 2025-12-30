import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id } = await req.json();
    
    if (!user_id) {
      console.error('Missing user_id in request');
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking categories for user: ${user_id}`);

    // Check if user already has default categories
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_default', true)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing categories:', checkError);
      return new Response(
        JSON.stringify({ error: checkError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existing && existing.length > 0) {
      console.log(`User ${user_id} already has default categories`);
      return new Response(
        JSON.stringify({ message: 'Categories already exist', provisioned: false }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Provisioning default categories for user: ${user_id}`);

    // Default categories to insert
    const defaultCategories = [
      // Expenses
      { user_id, name: 'Food', type: 'EXPENSE', icon: '🍔', color: '#EF4444', is_default: true },
      { user_id, name: 'Transport', type: 'EXPENSE', icon: '🚗', color: '#3B82F6', is_default: true },
      { user_id, name: 'Entertainment', type: 'EXPENSE', icon: '🎮', color: '#8B5CF6', is_default: true },
      { user_id, name: 'Shopping', type: 'EXPENSE', icon: '🛍️', color: '#EC4899', is_default: true },
      { user_id, name: 'Bills', type: 'EXPENSE', icon: '📄', color: '#F59E0B', is_default: true },
      { user_id, name: 'Health', type: 'EXPENSE', icon: '💊', color: '#10B981', is_default: true },
      { user_id, name: 'Education', type: 'EXPENSE', icon: '📚', color: '#6366F1', is_default: true },
      { user_id, name: 'Other', type: 'EXPENSE', icon: '📦', color: '#6B7280', is_default: true },
      // Income
      { user_id, name: 'Salary', type: 'INCOME', icon: '💰', color: '#10B981', is_default: true },
      { user_id, name: 'Freelance', type: 'INCOME', icon: '💼', color: '#3B82F6', is_default: true },
      { user_id, name: 'Investment', type: 'INCOME', icon: '📈', color: '#8B5CF6', is_default: true },
      { user_id, name: 'Gift', type: 'INCOME', icon: '🎁', color: '#EC4899', is_default: true },
      { user_id, name: 'Other', type: 'INCOME', icon: '💵', color: '#6B7280', is_default: true },
    ];

    const { error: insertError } = await supabase
      .from('categories')
      .insert(defaultCategories);

    if (insertError) {
      console.error('Error inserting categories:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully provisioned ${defaultCategories.length} categories for user: ${user_id}`);
    
    return new Response(
      JSON.stringify({ message: 'Categories provisioned successfully', provisioned: true, count: defaultCategories.length }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
