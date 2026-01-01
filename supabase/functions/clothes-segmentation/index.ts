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

    if (!image || typeof image !== "string") {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // vmake expects either an image URL or *raw* base64 (no data:... prefix)
    let normalizedImage = image.trim();
    if (normalizedImage.startsWith("data:")) {
      const commaIndex = normalizedImage.indexOf(",");
      if (commaIndex !== -1) normalizedImage = normalizedImage.slice(commaIndex + 1);
    }

    if (!normalizedImage) {
      return new Response(
        JSON.stringify({ error: "Invalid image payload" }),
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

    // Request masks:
    // - unifiedMasks for combined garment area and for "person parts" (skin/face/hair etc) to subtract
    // - taggedMasks for debugging + fallback
    const subtractTags = ["skin", "face", "hair", "gloves", "socks", "shoes"]; 

    const response = await fetch(VMAKE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": VMAKE_API_KEY,
      },
      body: JSON.stringify({
        image: normalizedImage,
        maskDataType: "base64",
        unifiedMasks: [
          { tags: targetTags, maskDataType: "base64" },
          { tags: subtractTags, maskDataType: "base64" },
        ],
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

    // API sometimes returns HTTP 200 with an error code in body
    if (typeof data?.code === "number" && data.code !== 0) {
      console.error("[clothes-segmentation] API body error:", data);
      return new Response(
        JSON.stringify({ error: data?.message || "API error", apiCode: data.code }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[clothes-segmentation] API response received");
    console.log("[clothes-segmentation] Response data keys:", Object.keys(data?.data || {}));

    const unifiedMasks = data?.data?.unifiedMasks as any[] | undefined;
    const taggedMasks = data?.data?.taggedMasks as any[] | undefined;

    console.log("[clothes-segmentation] unifiedMasks count:", unifiedMasks?.length);
    console.log("[clothes-segmentation] taggedMasks count:", taggedMasks?.length);

    // Prefer unified garment mask (merged), fallback to tagged mask.
    const garmentUnified = unifiedMasks?.[0]?.mask as string | undefined;
    const subtractUnified = unifiedMasks?.[1]?.mask as string | undefined;

    let garmentMask = garmentUnified;
    let selectedTag: string | null = null;

    if (!garmentMask && taggedMasks && taggedMasks.length > 0) {
      const matching = taggedMasks.filter((m: any) => targetTags.includes(m.tag) && m.mask);
      const picked = matching[0];
      garmentMask = picked?.mask;
      selectedTag = picked?.tag ?? null;
    }

    if (!garmentMask) {
      return new Response(
        JSON.stringify({ 
          error: `No ${garmentType} clothing detected in the image`,
          noClothingFound: true,
          requestedTags: targetTags,
          detectedTags: taggedMasks?.map((m: any) => m.tag) || []
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        garmentType,
        mask: garmentMask,
        subtractMask: subtractUnified || null,
        tag: selectedTag,
        allDetectedTags: taggedMasks?.map((m: any) => m.tag) || [],
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
