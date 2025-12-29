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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is a super admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is super admin
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    
    if (!isSuperAdmin) {
      throw new Error('Access denied. Super admin privileges required.');
    }

    const { targetUserId, subject, content, templateId } = await req.json();

    if (!targetUserId || !subject || !content) {
      throw new Error('Missing required fields: targetUserId, subject, content');
    }

    // Get target user email
    const { data: targetEmail } = await supabase.rpc('admin_get_user_email', { _user_id: targetUserId });

    if (!targetEmail) {
      throw new Error('Target user not found');
    }

    // For now, we'll create an internal message since email sending requires additional setup
    // In production, you would integrate with Resend, SendGrid, or similar
    const { error: messageError } = await supabase
      .from('user_messages')
      .insert({
        user_id: targetUserId,
        sender_id: user.id,
        title: subject,
        content: content,
        message_type: 'incentive'
      });

    if (messageError) {
      throw messageError;
    }

    // Log the action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: user.id,
        action_type: 'SEND_MESSAGE',
        target_user_id: targetUserId,
        details: { subject, template_id: templateId },
        note: `Message sent: ${subject}`
      });

    console.log(`Message sent to user ${targetUserId}: ${subject}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully',
        email: targetEmail 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in admin-send-email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
