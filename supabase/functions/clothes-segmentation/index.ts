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

    // All supported clothing tags according to vmake API documentation
    // Top-related: coat, outerwear, dress, jumpsuit
    // Bottom-related: pants, skirt
    const topTags = ["coat", "outerwear", "dress", "jumpsuit"];
    const bottomTags = ["pants", "skirt"];
    const targetTags = garmentType === "top" ? topTags : bottomTags;
    
    // Create taggedMasks config array - each tag must be explicitly requested
    const taggedMasksConfig = targetTags.map(tag => ({ tag, maskDataType: "base64" }));

    console.log(`[clothes-segmentation] Processing ${garmentType} with tags:`, targetTags);
    console.log(`[clothes-segmentation] taggedMasks config:`, JSON.stringify(taggedMasksConfig));

    // Request tagged masks with explicit tag configuration
    const response = await fetch(VMAKE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": VMAKE_API_KEY,
      },
      body: JSON.stringify({
        image,
        maskDataType: "base64",
        taggedMasks: taggedMasksConfig,
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
    console.log("[clothes-segmentation] Response data keys:", Object.keys(data?.data || {}));

    // Get tagged masks from response
    const taggedMasks = data?.data?.taggedMasks;
    console.log("[clothes-segmentation] Full response:", JSON.stringify(data, null, 2).substring(0, 500));
    console.log("[clothes-segmentation] Tagged masks count:", taggedMasks?.length);
    
    if (taggedMasks && taggedMasks.length > 0) {
      console.log("[clothes-segmentation] Available tags:", taggedMasks.map((m: any) => m.tag));
    }

    // Find the first mask that has actual data (not empty)
    const validMask = taggedMasks?.find((m: any) => m.mask && m.mask.length > 0);

    if (!validMask) {
      return new Response(
        JSON.stringify({ 
          error: `No ${garmentType} clothing detected in the image`, 
          noClothingFound: true,
          requestedTags: targetTags
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[clothes-segmentation] Selected mask tag:", validMask.tag);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        mask: validMask.mask,
        tag: validMask.tag,
        allDetectedTags: taggedMasks?.map((m: any) => m.tag) || []
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
