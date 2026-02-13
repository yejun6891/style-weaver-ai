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
    const { share_code, visitor_fingerprint } = await req.json();

    // Validate share_code
    if (!share_code || typeof share_code !== 'string' || share_code.length > 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid share code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(share_code)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid share code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate visitor_fingerprint if provided
    if (visitor_fingerprint && (typeof visitor_fingerprint !== 'string' || visitor_fingerprint.length > 200)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid fingerprint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a simple fingerprint if not provided
    const fingerprint = visitor_fingerprint || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to process the click
    const { data, error } = await supabase.rpc('process_share_click', {
      p_share_code: share_code,
      p_visitor_fingerprint: fingerprint
    });

    if (error) {
      console.error('Error processing share click:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to process click' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Share click processed:', { share_code, result: data });

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in share-click function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
