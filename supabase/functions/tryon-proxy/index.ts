// Redeployed: 2025-12-23 - Force config.toml apply
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-action",
};

const BACKEND_BASE_URL = "https://tyron-backend-8yaa.onrender.com";

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const contentType = req.headers.get("content-type") || "";

    // action 결정: query param -> header -> JSON body -> method 기반 기본값
    let action = url.searchParams.get("action") || req.headers.get("x-action");
    let jsonBody: { action?: string; taskId?: string } | null = null;

    // JSON body에서 action 읽기 (multipart가 아닌 경우)
    if (!action && contentType.includes("application/json")) {
      try {
        jsonBody = await req.clone().json();
        action = jsonBody?.action || null;
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }

    if (!action) {
      if (req.method === "POST") action = "start";
      else if (req.method === "GET") action = "result";
    }

    // Create Supabase client to verify auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[tryon-proxy] Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[tryon-proxy] Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[tryon-proxy] Authenticated user: ${user.id}, action: ${action}`);

    // Handle "result" action - poll for results
    if (action === "result") {
      // taskId: query param 우선, 없으면 JSON body에서
      let taskId = url.searchParams.get("taskId");
      if (!taskId && jsonBody?.taskId) {
        taskId = jsonBody.taskId;
      }

      if (!taskId) {
        return new Response(
          JSON.stringify({ error: "Missing taskId parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate taskId format (basic alphanumeric check)
      if (!/^[a-zA-Z0-9_-]+$/.test(taskId)) {
        return new Response(
          JSON.stringify({ error: "Invalid taskId format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify task ownership - user can only access their own tasks
      const { data: taskOwnership, error: ownershipError } = await supabase
        .from("task_ownership")
        .select("user_id")
        .eq("task_id", taskId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownershipError) {
        console.error("[tryon-proxy] Ownership check error:", ownershipError.message);
        return new Response(
          JSON.stringify({ error: "Failed to verify task ownership" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!taskOwnership) {
        console.log(`[tryon-proxy] Access denied: User ${user.id} attempted to access task ${taskId}`);
        return new Response(
          JSON.stringify({ error: "Task not found or access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[tryon-proxy] Ownership verified, polling result for taskId: ${taskId}`);

      const backendRes = await fetch(
        `${BACKEND_BASE_URL}/api/tryon/result?taskId=${encodeURIComponent(taskId)}`
      );
      const resultData = await backendRes.json();

      return new Response(JSON.stringify(resultData), {
        status: backendRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle "start" action - initiate try-on
    if (action === "start") {
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check user credits
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("[tryon-proxy] Profile error:", profileError?.message);
        return new Response(
          JSON.stringify({ error: "User profile not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (profile.credits < 1) {
        console.log(`[tryon-proxy] User ${user.id} has insufficient credits: ${profile.credits}`);
        return new Response(
          JSON.stringify({ error: "Insufficient credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse the incoming form data
      const formData = await req.formData();
      const validatedFormData = new FormData();

      // Validate and forward files
      const fileFields = ["person_image", "top_garment", "bottom_garment"];
      
      for (const fieldName of fileFields) {
        const file = formData.get(fieldName) as File | null;
        if (!file) {
          if (fieldName === "bottom_garment") continue; // Optional field
          if (fieldName === "person_image" || fieldName === "top_garment") {
            return new Response(
              JSON.stringify({ error: `Missing required field: ${fieldName}` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          console.log(`[tryon-proxy] File ${fieldName} too large: ${file.size} bytes`);
          return new Response(
            JSON.stringify({ error: `File ${fieldName} exceeds 5MB limit` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          console.log(`[tryon-proxy] Invalid file type for ${fieldName}: ${file.type}`);
          return new Response(
            JSON.stringify({ error: `Invalid file type for ${fieldName}. Allowed: JPEG, PNG, GIF, WebP` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Additional validation: Check magic bytes for image files
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer.slice(0, 12));
        
        if (!isValidImageMagicBytes(bytes)) {
          console.log(`[tryon-proxy] Invalid magic bytes for ${fieldName}`);
          return new Response(
            JSON.stringify({ error: `File ${fieldName} is not a valid image` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Re-create the file from the validated buffer
        const validatedFile = new File([buffer], file.name, { type: file.type });
        validatedFormData.append(fieldName, validatedFile);
      }

      console.log(`[tryon-proxy] Forwarding validated request to backend for user ${user.id}`);

      // Forward to the actual backend
      const backendRes = await fetch(`${BACKEND_BASE_URL}/api/tryon/start`, {
        method: "POST",
        body: validatedFormData,
      });

      const responseData = await backendRes.json();

      if (backendRes.ok && responseData.taskId) {
        // Store task ownership for access control
        const { error: ownershipInsertError } = await supabase
          .from("task_ownership")
          .insert({
            task_id: responseData.taskId,
            user_id: user.id,
          });

        if (ownershipInsertError) {
          console.error("[tryon-proxy] Failed to store task ownership:", ownershipInsertError.message);
        } else {
          console.log(`[tryon-proxy] Stored task ownership: ${responseData.taskId} -> ${user.id}`);
        }

        // Deduct credit on successful task creation
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ credits: profile.credits - 1 })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("[tryon-proxy] Failed to deduct credit:", updateError.message);
        } else {
          console.log(`[tryon-proxy] Deducted 1 credit from user ${user.id}, remaining: ${profile.credits - 1}`);
        }

        // Log usage history
        await supabase.from("usage_history").insert({
          user_id: user.id,
          action_type: "virtual_tryon",
          credits_used: 1,
        });
      }

      return new Response(JSON.stringify(responseData), {
        status: backendRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'start' or 'result'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[tryon-proxy] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to validate image magic bytes
function isValidImageMagicBytes(bytes: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true;
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
      bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
    return true;
  }
  
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return true;
  }
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return true;
  }
  
  return false;
}
