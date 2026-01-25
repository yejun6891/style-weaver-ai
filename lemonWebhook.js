// lemonWebhook.js - Lemon Squeezy Webhook Handler for Render Backend
// Add this file to your Tyron-backend repository

const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Variant ID → Credits mapping (using environment variables from Render)
const VARIANT_TO_CREDITS = {
  [process.env.LEMONSQUEEZY_VARIANT_ID_STARTER]: 8,   // 8 credits package
  [process.env.LEMONSQUEEZY_VARIANT_ID_PLUS]: 18,     // 18 credits package
  [process.env.LEMONSQUEEZY_VARIANT_ID_PRO]: 30,      // 30 credits package
};

/**
 * Verify HMAC SHA-256 signature from Lemon Squeezy
 */
function verifySignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  return signature === digest;
}

/**
 * POST /api/lemon-webhook
 * Handles Lemon Squeezy webhook events
 */
router.post('/lemon-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-signature'];
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    
    // Get raw body for signature verification
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    // Verify HMAC signature
    if (!verifySignature(rawBody, signature, webhookSecret)) {
      console.error('[Lemon Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventName = payload.meta?.event_name;
    
    console.log('[Lemon Webhook] Received event:', eventName);
    
    // Only process order_created events
    if (eventName !== 'order_created') {
      console.log('[Lemon Webhook] Ignoring event:', eventName);
      return res.status(200).json({ success: true, message: 'Event ignored' });
    }

    // Extract data from payload
    const userId = payload.meta?.custom_data?.user_id;
    const promoId = payload.meta?.custom_data?.promo_id;
    const variantId = String(payload.data?.attributes?.first_order_item?.variant_id);
    const creditsToAdd = VARIANT_TO_CREDITS[variantId];
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
      return res.status(400).json({ error: 'Missing user_id' });
    }

    if (!creditsToAdd) {
      console.error('[Lemon Webhook] Unknown variant_id:', variantId);
      return res.status(400).json({ error: 'Unknown variant' });
    }

    // Check for duplicate order (idempotency)
    const { data: existingPayment } = await supabaseAdmin
      .from('payment_logs')
      .select('id')
      .eq('lemon_order_id', orderId)
      .maybeSingle();

    if (existingPayment) {
      console.log('[Lemon Webhook] Order already processed:', orderId);
      return res.status(200).json({ success: true, message: 'Already processed' });
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

    return res.status(200).json({ 
      success: true, 
      credits_added: creditsToAdd 
    });

  } catch (error) {
    console.error('[Lemon Webhook] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
