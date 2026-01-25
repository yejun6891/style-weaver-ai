import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

// Variant ID → 크레딧 매핑 (Lemon Squeezy 대시보드에서 확인 필요)
const VARIANT_TO_CREDITS: Record<string, number> = {
  // 실제 variant_id로 업데이트 필요
  '594336': 8,   // 8 credits 패키지
  '594337': 18,  // 18 credits 패키지
  '594338': 30,  // 30 credits 패키지
};

async function verifySignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  return signature === computedSignature;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-signature');
    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    const body = await req.text();
    
    // Verify HMAC signature
    const isValid = await verifySignature(body, signature, webhookSecret || '');
    if (!isValid) {
      console.error('Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const payload = JSON.parse(body);
    const eventName = payload.meta?.event_name;
    
    console.log('Received event:', eventName);
    
    // Only process order_created events
    if (eventName !== 'order_created') {
      console.log('Ignoring event:', eventName);
      return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user_id from custom_data
    const userId = payload.meta?.custom_data?.user_id;
    const variantId = String(payload.data?.attributes?.first_order_item?.variant_id);
    const creditsToAdd = VARIANT_TO_CREDITS[variantId];
    const orderId = String(payload.data?.id);

    console.log('Processing order:', { userId, variantId, creditsToAdd, orderId });

    if (!userId) {
      console.error('Missing user_id in custom_data');
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!creditsToAdd) {
      console.error('Unknown variant_id:', variantId);
      return new Response(JSON.stringify({ error: 'Unknown variant' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with Service Role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for duplicate order (idempotency)
    const { data: existingPayment } = await supabase
      .from('payment_logs')
      .select('id')
      .eq('lemon_order_id', orderId)
      .maybeSingle();

    if (existingPayment) {
      console.log('Order already processed:', orderId);
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add credits using admin function
    const { error: creditError } = await supabase.rpc('add_credits_admin', {
      p_user_id: userId,
      p_credits: creditsToAdd,
    });

    if (creditError) {
      console.error('Failed to add credits:', creditError);
      throw creditError;
    }

    // Log payment for idempotency and auditing
    const { error: logError } = await supabase.from('payment_logs').insert({
      user_id: userId,
      credits_added: creditsToAdd,
      lemon_order_id: orderId,
      variant_id: variantId,
    });

    if (logError) {
      console.error('Failed to log payment:', logError);
      // Don't throw - credits were already added
    }

    console.log('Credits added successfully:', { userId, creditsToAdd, orderId });

    return new Response(JSON.stringify({ success: true, credits_added: creditsToAdd }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
