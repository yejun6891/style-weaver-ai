// Redeployed: 2026-01-06 - Two-step full mode support
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-action, x-user-token",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, cancel: () => clearTimeout(id) };
}

async function fetchJsonWithTimeout(input: RequestInfo | URL, init: RequestInit | undefined, timeoutMs: number) {
  const { controller, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = { error: "Upstream returned a non-JSON response" };
    }
    return { res, json };
  } finally {
    cancel();
  }
}

const BACKEND_BASE_URL = "https://tyron-backend-8yaa.onrender.com";

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Valid try-on modes
type TryonMode = "top" | "bottom" | "full";
type FullModeType = "separate" | "single";

// Timeout settings (in milliseconds)
const TIMEOUT_SINGLE_MODE = 30000;  // 30s for top/bottom
const TIMEOUT_CONTINUE = 30000;     // 30s for continue-full (single API call)
const TIMEOUT_RESULT = 15000;       // 15s for result polling

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
    let jsonBody: { action?: string; taskId?: string; step1TaskId?: string; step1ImageUrl?: string } | null = null;

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
    const userTokenHeader = req.headers.get("x-user-token");

    const userBearer = userTokenHeader
      ? `Bearer ${userTokenHeader.replace(/^Bearer\s+/i, "")}`
      : authHeader;

    if (!userBearer) {
      console.error("[tryon-proxy] Missing auth token (Authorization or x-user-token)");
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: userBearer } },
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

      if (!/^[a-zA-Z0-9._-]+$/.test(taskId)) {
        return new Response(
          JSON.stringify({ error: "Invalid taskId format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify task ownership
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

      try {
        const { res: backendRes, json: resultData } = await fetchJsonWithTimeout(
          `${BACKEND_BASE_URL}/api/tryon/result?taskId=${encodeURIComponent(taskId)}`,
          {
            headers: {
              "Authorization": userBearer,
            },
          },
          TIMEOUT_RESULT,
        );

        return new Response(JSON.stringify(resultData), {
          status: backendRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        const isTimeout = (e as any)?.name === "AbortError";
        console.error("[tryon-proxy] Backend result fetch failed:", e);
        return new Response(
          JSON.stringify({ error: isTimeout ? "Upstream timeout" : "Upstream request failed" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Handle "continue-full" action - Step 2 of full mode
    if (action === "continue-full") {
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse JSON body for continue-full
      let body: { step1TaskId?: string; step1ImageUrl?: string } | null = null;
      if (contentType.includes("application/json")) {
        try {
          body = await req.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON body" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const step1TaskId = body?.step1TaskId;
      const step1ImageUrl = body?.step1ImageUrl;

      if (!step1TaskId || !step1ImageUrl) {
        return new Response(
          JSON.stringify({ error: "Missing step1TaskId or step1ImageUrl" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify step1 task ownership
      const { data: taskOwnership, error: ownershipError } = await supabase
        .from("task_ownership")
        .select("user_id")
        .eq("task_id", step1TaskId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownershipError || !taskOwnership) {
        console.error("[tryon-proxy] Step1 task ownership check failed");
        return new Response(
          JSON.stringify({ error: "Step 1 task not found or access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[tryon-proxy] Continue-full: Step1 ownership verified, calling backend continue-full`);

      try {
        // Forward to backend's continue-full endpoint
        const { res: backendRes, json: responseData } = await fetchJsonWithTimeout(
          `${BACKEND_BASE_URL}/api/tryon/continue-full`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": userBearer,
            },
            body: JSON.stringify({
              step1TaskId,
              step1ImageUrl,
            }),
          },
          TIMEOUT_CONTINUE,
        );

        if (backendRes.ok && responseData.taskId) {
          // Store step2 task ownership
          const { error: ownershipInsertError } = await supabase
            .from("task_ownership")
            .insert({
              task_id: responseData.taskId,
              user_id: user.id,
            });

          if (ownershipInsertError) {
            console.error("[tryon-proxy] Failed to store step2 task ownership:", ownershipInsertError.message);
          } else {
            console.log(`[tryon-proxy] Stored step2 task ownership: ${responseData.taskId} -> ${user.id}`);
          }

          // Update usage_history to point to the final step2 task (so dashboard shows final result)
          const { error: updateError } = await supabase
            .from("usage_history")
            .update({ task_id: responseData.taskId })
            .eq("user_id", user.id)
            .eq("task_id", step1TaskId);

          if (updateError) {
            console.error("[tryon-proxy] Failed to update usage_history with step2 taskId:", updateError.message);
          } else {
            console.log(`[tryon-proxy] Updated usage_history: ${step1TaskId} -> ${responseData.taskId}`);
          }
        }

        return new Response(JSON.stringify(responseData), {
          status: backendRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        const isTimeout = (e as any)?.name === "AbortError";
        console.error("[tryon-proxy] Backend continue-full fetch failed:", e);
        return new Response(
          JSON.stringify({ error: isTimeout ? "Upstream timeout" : "Upstream request failed" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Handle "start" action - initiate try-on
    if (action === "start") {
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse the incoming form data
      const formData = await req.formData();
      
      // Get mode from form data (default to "top" for backward compatibility)
      const modeValue = formData.get("mode") as string || "top";
      const mode: TryonMode = ["top", "bottom", "full"].includes(modeValue) 
        ? modeValue as TryonMode 
        : "top";

      // Get fullModeType from form data (only relevant when mode is "full")
      const fullModeTypeValue = formData.get("fullModeType") as string || "separate";
      const fullModeType: FullModeType = ["separate", "single"].includes(fullModeTypeValue)
        ? fullModeTypeValue as FullModeType
        : "separate";

      // Calculate required credits based on mode and fullModeType
      // full-separate: 2 credits (two API calls), full-single: 1 credit (one API call)
      const creditsRequired = mode === "full" 
        ? (fullModeType === "single" ? 1 : 2) 
        : 1;

      console.log(`[tryon-proxy] Mode: ${mode}, FullModeType: ${fullModeType}, Credits required: ${creditsRequired}`);

      // Check credit BEFORE starting the upstream job
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[tryon-proxy] Credit pre-check failed:", profileError.message);
        return new Response(
          JSON.stringify({ error: "Failed to verify credits" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const currentCredits = profileRow?.credits ?? 0;
      if (currentCredits < creditsRequired) {
        console.log(`[tryon-proxy] User ${user.id} has insufficient credits (${currentCredits} < ${creditsRequired})`);
        return new Response(
          JSON.stringify({ error: "Insufficient credits", required: creditsRequired, current: currentCredits }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.log(`[tryon-proxy] Credit pre-check OK (credits=${currentCredits}, required=${creditsRequired}) for user ${user.id}`);

      const validatedFormData = new FormData();
      validatedFormData.append("mode", mode);
      
      // Add fullModeType when mode is "full"
      if (mode === "full") {
        validatedFormData.append("fullModeType", fullModeType);
      }

      // Determine required files based on mode and fullModeType
      const requiredFields: string[] = ["person_image"];
      if (mode === "top") requiredFields.push("top_garment");
      if (mode === "bottom") requiredFields.push("bottom_garment");
      if (mode === "full") {
        if (fullModeType === "single") {
          // Single mode: only need top_garment (which contains the full outfit)
          requiredFields.push("top_garment");
        } else {
          // Separate mode: need both top and bottom
          requiredFields.push("top_garment");
          requiredFields.push("bottom_garment");
        }
      }

      const optionalFields: string[] = [];
      const allFields = [...requiredFields, ...optionalFields];

      // Validate and forward files
      for (const fieldName of allFields) {
        const file = formData.get(fieldName) as File | null;
        if (!file) {
          if (requiredFields.includes(fieldName)) {
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

      console.log(`[tryon-proxy] Forwarding validated request to backend for user ${user.id}, mode=${mode}, fullModeType=${fullModeType}`);

      try {
        // Forward to the actual backend
        const { res: backendRes, json: responseData } = await fetchJsonWithTimeout(
          `${BACKEND_BASE_URL}/api/tryon/start`,
          { 
            method: "POST", 
            body: validatedFormData,
            headers: {
              "Authorization": userBearer,
            },
          },
          TIMEOUT_SINGLE_MODE,
        );

        if (backendRes.ok && responseData.taskId) {
          // Deduct credits AFTER we have a taskId
          const { error: creditError } = await supabase
            .from("profiles")
            .update({ credits: currentCredits - creditsRequired })
            .eq("user_id", user.id);

          if (creditError) {
            console.error("[tryon-proxy] Credit deduction error:", creditError.message);
          } else {
            console.log(`[tryon-proxy] Deducted ${creditsRequired} credit(s) from user ${user.id} for task ${responseData.taskId}`);
          }

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

          console.log(`[tryon-proxy] Task ${responseData.taskId} created successfully for user ${user.id}, mode=${mode}`);

          // Clean up expired history entries (1 hour retention with Fashn.ai)
          const expirationTime = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
          const { data: expiredHistory } = await supabase
            .from("usage_history")
            .select("id")
            .eq("user_id", user.id)
            .not("task_id", "is", null)
            .lt("created_at", expirationTime);

          if (expiredHistory && expiredHistory.length > 0) {
            const idsToDelete = expiredHistory.map(h => h.id);
            await supabase
              .from("usage_history")
              .delete()
              .in("id", idsToDelete);
            console.log(`[tryon-proxy] Deleted ${idsToDelete.length} expired usage history entries for user ${user.id}`);
          }

          // Log usage history with mode info
          const actionType = mode === "full" ? "virtual_tryon_full" : `virtual_tryon_${mode}`;
          await supabase.from("usage_history").insert({
            user_id: user.id,
            action_type: actionType,
            credits_used: creditsRequired,
            task_id: responseData.taskId,
          });
        }

        return new Response(JSON.stringify(responseData), {
          status: backendRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        const isTimeout = (e as any)?.name === "AbortError";
        console.error("[tryon-proxy] Backend start fetch failed:", e);
        return new Response(
          JSON.stringify({ error: isTimeout ? "Upstream timeout" : "Upstream request failed" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'start', 'result', or 'continue-full'" }),
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
