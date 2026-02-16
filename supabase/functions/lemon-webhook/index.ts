import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

// Variant ID → Credits mapping (loaded at request time for fresh env vars)
function getVariantCredits(variantId: string): number | undefined {
  const starterVariant = Deno.env.get('LEMONSQUEEZY_VARIANT_ID_STARTER')?.trim();
  const plusVariant = Deno.env.get('LEMONSQUEEZY_VARIANT_ID_PLUS')?.trim();
  const proVariant = Deno.env.get('LEMONSQUEEZY_VARIANT_ID_PRO')?.trim();
  
  console.log('[Lemon Webhook] Variant env vars:', { 
    starterVariant, 
    plusVariant, 
    proVariant,
    receivedVariant: variantId 
  });
  
  if (variantId === starterVariant) return 8;
  if (variantId === plusVariant) return 18;
  if (variantId === proVariant) return 30;
  
  return undefined;
}

/**
 * Verify HMAC SHA-256 signature from Lemon Squeezy
 */
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return signature === computedSignature;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-signature') || '';
    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET') || '';
    
    // Get raw body for signature verification
    const rawBody = await req.text();
    
    console.log('[Lemon Webhook] Received request');
    
    // Verify HMAC signature
    if (!await verifySignature(rawBody, signature, webhookSecret)) {
      console.error('[Lemon Webhook] Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    
    console.log('[Lemon Webhook] Received event:', eventName);
    
    // Only process order_created events
    if (eventName !== 'order_created') {
      console.log('[Lemon Webhook] Ignoring event:', eventName);
      return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract data from payload
    const userId = payload.meta?.custom_data?.user_id;
    const promoId = payload.meta?.custom_data?.promo_id;
    const rawVariantId = payload.data?.attributes?.first_order_item?.variant_id;
    if (rawVariantId === undefined || rawVariantId === null) {
      console.error('[Lemon Webhook] Missing variant_id in payload');
      return new Response(JSON.stringify({ error: 'Missing variant_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const variantId = String(rawVariantId);
    if (!/^\d+$/.test(variantId) || variantId.length > 20) {
      console.error('[Lemon Webhook] Invalid variant_id format:', variantId);
      return new Response(JSON.stringify({ error: 'Invalid variant_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const creditsToAdd = getVariantCredits(variantId);
    const orderId = String(payload.data?.id);

    console.log('[Lemon Webhook] Processing order:', { 
      userId, 
      variantId, 
      creditsToAdd, 
      orderId,
      promoId 
    });

    // Validate required data
    if (!userId) {
      console.error('[Lemon Webhook] Missing user_id in custom_data');
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!creditsToAdd) {
      console.error('[Lemon Webhook] Unknown variant_id:', variantId);
      return new Response(JSON.stringify({ error: 'Unknown variant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Check for duplicate order (idempotency)
    const { data: existingPayment } = await supabaseAdmin
      .from('payment_logs')
      .select('id')
      .eq('lemon_order_id', orderId)
      .maybeSingle();

    if (existingPayment) {
      console.log('[Lemon Webhook] Order already processed:', orderId);
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add credits using admin function
    const { error: creditError } = await supabaseAdmin.rpc('add_credits_admin', {
      p_user_id: userId,
      p_credits: creditsToAdd,
    });

    if (creditError) {
      console.error('[Lemon Webhook] Failed to add credits:', creditError);
      throw creditError;
    }

    // Log payment for idempotency and auditing
    const { error: logError } = await supabaseAdmin.from('payment_logs').insert({
      user_id: userId,
      credits_added: creditsToAdd,
      lemon_order_id: orderId,
      variant_id: variantId,
    });

    if (logError) {
      console.error('[Lemon Webhook] Failed to log payment:', logError);
      // Don't throw - credits were already added
    }

    // Mark promo code as used if applicable
    if (promoId) {
      const { error: promoError } = await supabaseAdmin
        .from('user_promo_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', promoId);
      
      if (promoError) {
        console.error('[Lemon Webhook] Failed to mark promo as used:', promoError);
      }
    }

    console.log('[Lemon Webhook] Credits added successfully:', { 
      userId, 
      creditsToAdd, 
      orderId 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      credits_added: creditsToAdd 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Lemon Webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
