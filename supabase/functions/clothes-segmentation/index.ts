import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VMAKE_API_URL = "https://open.x-design.com/api/v2/image/clothes-segmentation";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VMAKE_API_KEY = Deno.env.get("VMAKE_API_KEY");
    if (!VMAKE_API_KEY) {
      throw new Error("VMAKE_API_KEY is not configured");
    }

    const { image, garmentType } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!garmentType || !["top", "bottom"].includes(garmentType)) {
      return new Response(
        JSON.stringify({ error: "garmentType must be 'top' or 'bottom'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Define tags based on garment type
    // top: coat, outerwear, dress, jumpsuit (upper body garments)
    // bottom: pants, skirt (lower body garments)
    const tags = garmentType === "top" 
      ? ["coat", "outerwear", "dress", "jumpsuit"]
      : ["pants", "skirt"];

    console.log(`[clothes-segmentation] Processing ${garmentType} with tags:`, tags);

    const response = await fetch(VMAKE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": VMAKE_API_KEY,
      },
      body: JSON.stringify({
        image,
        maskDataType: "base64",
        unifiedMasks: [{ tags }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[clothes-segmentation] API error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("[clothes-segmentation] API response received");

    // Extract the unified mask
    const unifiedMasks = data?.data?.unifiedMasks;
    if (!unifiedMasks || unifiedMasks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No clothing detected in the image", noClothingFound: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mask = unifiedMasks[0].mask;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        mask,
        tags: unifiedMasks[0].tags 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[clothes-segmentation] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
