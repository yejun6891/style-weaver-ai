import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import Logo from "@/components/Logo";
import StyleAnalysisReport from "@/components/StyleAnalysisReport";
import ShareRewardSection from "@/components/ShareRewardSection";
import LoadingTips from "@/components/LoadingTips";
import { StyleProfile } from "@/components/StyleProfileForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, RefreshCw, Sparkles, Share2, Image, FileText, Check, Shirt, Clock, MessageCircle } from "lucide-react";

type Status = "loading" | "step1-polling" | "step2-starting" | "step2-polling" | "success" | "error";

interface StyleAnalysisData {
  celebrityMatch: {
    name: string;
    reason: string;
    styleTip: string;
  };
  brandCuration: Array<{
    name: string;
    priceRange: string;
    reason: string;
  }>;
  actionPlan: string[];
  fittingGuide: string;
  styleTags: string[];
}

const defaultStyleProfile: StyleProfile = {
  gender: "",
  height: "",
  bodyTypes: [],
  bodyTypeOther: "",
  occasions: [],
  occasionOther: "",
  styles: [],
  styleOther: "",
  concerns: "",
  runMode: "performance",
  garmentPhotoType: "flat-lay",
  country: "",
};

const Result = () => {
  const { taskId: taskIdParam } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { session } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [styleProfile, setStyleProfile] = useState<StyleProfile>(defaultStyleProfile);
  
  // Actual taskId (pending will be replaced with real one after upload)
  const [taskId, setTaskId] = useState<string | null>(taskIdParam === "pending" ? null : taskIdParam || null);
  const [isUploading, setIsUploading] = useState(taskIdParam === "pending");
  const uploadStartedRef = useRef(false);
  
  // Style analysis state
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const analysisCalledRef = useRef(false);
  
  // Track fitting completion separately from final status
  const [fittingComplete, setFittingComplete] = useState(false);
  const [fittingImageUrl, setFittingImageUrl] = useState<string | null>(null);
  
  // Full mode state
  const mode = searchParams.get("mode") || sessionStorage.getItem("tryonMode") || "top";
  const isAccessoryMode = mode === "accessory";
  const accessoryCategory = searchParams.get("category") || "";
  const isFullMode = mode === "full";
  // Two-step full mode is no longer used - always single mode
  const isTwoStepFullMode = false;
  const needsContinue = searchParams.get("needsContinue") === "true";
  const step1TaskIdParam = searchParams.get("step1TaskId") || taskId;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [step2TaskId, setStep2TaskId] = useState<string | null>(null);
  const continueCalledRef = useRef(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const pollCountRef = useRef(0);

  // Determine if user has filled out style profile (derived from state)
  const hasStyleProfile = styleProfile.bodyTypes.length > 0 || 
    styleProfile.occasions.length > 0 || 
    styleProfile.styles.length > 0 || 
    Boolean(styleProfile.concerns);

  useEffect(() => {
    // Load style profile from sessionStorage
    const stored = sessionStorage.getItem("styleProfile");
    if (stored) {
      try {
        setStyleProfile(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse style profile:", e);
      }
    }
  }, []);

  useEffect(() => {
    setStatusText(t("result.processing"));
  }, [t]);

  // Handle pending upload - process images and get real taskId
  useEffect(() => {
    if (!isUploading || uploadStartedRef.current) return;
    if (!session?.access_token) {
      navigate("/auth");
      return;
    }
    
    uploadStartedRef.current = true;
    
    const processUpload = async () => {
      try {
        console.log("[Result] Processing pending upload...");
        
        // Get files from global storage
        const files = (window as any).__pendingFiles;
        if (!files || !files.personFile) {
          console.error("[Result] No pending files found");
          navigate("/upload");
          return;
        }
        
        const { personFile, topFile, bottomFile, outfitFile } = files;
        const pendingData = JSON.parse(sessionStorage.getItem("pendingUpload") || "{}");
        const { mode: uploadMode, runMode, garmentPhotoType } = pendingData;
        
        // Refresh session
        const { data: { session: freshSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (refreshError || !freshSession?.access_token) {
          console.error("[Result] Session refresh failed");
          navigate("/auth");
          return;
        }
        
        // Import preprocessing functions dynamically to avoid circular deps
        const { preprocessPersonImage, preprocessTopGarment, preprocessBottomGarment } = 
          await import("@/utils/imagePreprocess");
        
        console.log("[Result] Preprocessing images...");
        const [processedPerson, processedTop, processedBottom] = await Promise.all([
          preprocessPersonImage(personFile),
          topFile ? preprocessTopGarment(topFile) : Promise.resolve(null),
          bottomFile ? preprocessBottomGarment(bottomFile) : Promise.resolve(null),
        ]);
        
        const formData = new FormData();
        formData.append("person_image", processedPerson);
        formData.append("mode", uploadMode);
        formData.append("runMode", runMode);
        formData.append("garmentPhotoType", garmentPhotoType);
        
        if (uploadMode === "full") {
          formData.append("fullModeType", "single");
          if (outfitFile) {
            const processedOutfit = await preprocessTopGarment(outfitFile);
            formData.append("top_garment", processedOutfit);
          }
        } else {
          if (processedTop) formData.append("top_garment", processedTop);
          if (processedBottom) formData.append("bottom_garment", processedBottom);
        }
        
        console.log("[Result] Calling tryon-proxy...");
        supabase.functions.setAuth(freshSession.access_token);
        
        const { data, error } = await supabase.functions.invoke("tryon-proxy", {
          body: formData,
          headers: {
            "x-user-token": freshSession.access_token,
          },
        });
        
        // Clean up global files
        delete (window as any).__pendingFiles;
        sessionStorage.removeItem("pendingUpload");
        
        if (error) {
          console.error("[Result] Upload error:", error);
          setStatus("error");
          setStatusText(t("result.error"));
          return;
        }
        
        if ((data as any)?.error) {
          console.error("[Result] Upload response error:", data);
          setStatus("error");
          setStatusText(t("result.error"));
          return;
        }
        
        const responseData = data as any;
        console.log("[Result] Got taskId:", responseData.taskId);
        setTaskId(responseData.taskId);
        setIsUploading(false);
        
        // Update URL without triggering navigation
        window.history.replaceState(null, "", `/result/${responseData.taskId}?mode=${uploadMode}`);
        
      } catch (err) {
        console.error("[Result] Upload processing error:", err);
        setStatus("error");
        setStatusText(t("result.error"));
      }
    };
    
    processUpload();
  }, [isUploading, session?.access_token, navigate, t]);

  // Elapsed time counter - runs while status is a loading state (including style analysis wait)
  const isLoadingState = isUploading || status === "loading" || status === "step1-polling" || status === "step2-starting" || status === "step2-polling" || 
    (fittingComplete && hasStyleProfile && analysisLoading);
  
  useEffect(() => {
    if (isLoadingState) {
      setElapsedTime(0); // Reset on new loading
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoadingState]);

  // Exponential backoff polling interval calculator
  const getPollingInterval = useCallback(() => {
    const baseInterval = 2000;  // 초반 2초
    const maxInterval = 8000;   // 최대 8초
    const factor = 1.3;
    return Math.min(baseInterval * Math.pow(factor, pollCountRef.current), maxInterval);
  }, []);

  // Main polling and flow logic
  useEffect(() => {
    // Wait for upload to complete and get real taskId
    if (!taskId || isUploading) {
      return;
    }

    if (!session?.access_token) {
      navigate("/auth");
      return;
    }

    // Prevent re-running if already completed or in error state
    if (status === "success" || status === "error" || fittingComplete) {
      return;
    }

    let isCancelled = false;
    let progressInterval: ReturnType<typeof setInterval>;

    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 500);

    // Poll for result with exponential backoff
    const pollResult = async (pollTaskId: string, onComplete: (imageUrl: string) => void) => {
      const check = async () => {
        if (isCancelled) return;

        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-proxy?action=result&taskId=${pollTaskId}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[Result] fetch error:", response.status, errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const data = await response.json();

          if (isCancelled) return;

          const taskStatus = data.status;

          if (taskStatus === 2 && data.imageUrl) {
            console.log(`[Result] ✅ Image received! Total elapsed: ${elapsedTime}s, Poll attempts: ${pollCountRef.current}`);
            onComplete(data.imageUrl);
            return;
          } else if (taskStatus === 0 || taskStatus === 1) {
            pollCountRef.current += 1;
            const nextInterval = getPollingInterval();
            console.log(`[Result] Polling again in ${nextInterval}ms (attempt ${pollCountRef.current})`);
            setTimeout(check, nextInterval);
          } else {
            console.error("Unexpected status:", data);
            setStatus("error");
            setStatusText(t("result.error"));
            clearInterval(progressInterval);
          }
        } catch (err) {
          console.error(err);
          if (!isCancelled) {
            setStatus("error");
            setStatusText(t("result.error"));
            clearInterval(progressInterval);
          }
        }
      };

      check();
    };

    // Continue to step 2 (for full mode)
    const continueToStep2 = async (step1ImageUrl: string) => {
      if (isCancelled || continueCalledRef.current) return;
      continueCalledRef.current = true;

      console.log("[Result] Starting step 2 with step1ImageUrl:", step1ImageUrl);
      setStatus("step2-starting");
      setCurrentStep(2);
      setProgress(50);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-proxy?action=continue-full`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              step1TaskId: step1TaskIdParam,
              step1ImageUrl,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[Result] continue-full error:", response.status, errorData);
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("[Result] Step 2 started:", data);

        if (data.taskId) {
          setStep2TaskId(data.taskId);
          setStatus("step2-polling");
          
          // Poll for step 2 result
          pollResult(data.taskId, (finalImageUrl) => {
            setProgress(100);
            setImageUrl(finalImageUrl);
            setStatus("success");
            clearInterval(progressInterval);
          });
        } else {
          throw new Error("No taskId returned from continue-full");
        }
      } catch (err) {
        console.error("[Result] Step 2 error:", err);
        if (!isCancelled) {
          setStatus("error");
          setStatusText(t("result.error"));
          clearInterval(progressInterval);
        }
      }
    };

    // Start the flow
    if (isTwoStepFullMode && needsContinue) {
      // Full mode separate: start polling step 1, then continue to step 2
      console.log("[Result] Full mode separate with needsContinue, polling step 1...");
      setStatus("step1-polling");
      setCurrentStep(1);
      
      pollResult(taskId, (step1ImageUrl) => {
        console.log("[Result] Step 1 complete:", step1ImageUrl);
        continueToStep2(step1ImageUrl);
      });
    } else {
      // Single mode, top/bottom mode, or full-single: just poll for final result
      console.log("[Result] Single step mode, polling...");
      setStatus("loading");
      
      pollResult(taskId, (finalImageUrl) => {
        console.log("[Result] Fitting complete, image received");
        setFittingComplete(true);
        setFittingImageUrl(finalImageUrl);
        setProgress(100);
        clearInterval(progressInterval);
      });
    }

    return () => {
      isCancelled = true;
      clearInterval(progressInterval);
    };
  }, [taskId, navigate, t, session, isTwoStepFullMode, needsContinue, step1TaskIdParam, fittingComplete, isUploading]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trupick-${taskId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(imageUrl, "_blank");
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "TruPick - AI Virtual Try-On",
          text: "Check out my virtual try-on result!",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Fetch style analysis - called immediately when session is available and style profile exists
  const fetchStyleAnalysis = useCallback(async () => {
    if (!session?.access_token || !hasStyleProfile || analysisCalledRef.current) return;
    
    analysisCalledRef.current = true;
    setAnalysisLoading(true);
    setAnalysisError(null);
    
    // Determine which endpoint to use based on mode
    const isAccessory = isAccessoryMode && accessoryCategory;
    const action = isAccessory ? "accessory-style-analysis" : "style-analysis";
    const bodyPayload = isAccessory 
      ? { profile: styleProfile, category: accessoryCategory, language }
      : { styleProfile, language };

    console.log(`[Result] Starting ${action} request...`, isAccessory ? `category=${accessoryCategory}` : "");
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-proxy?action=${action}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[Result] Style analysis received:", data);
      
      // Backend response structure: { success: true, analysis: {...} }
      if (data.success && data.analysis) {
        setStyleAnalysis(data.analysis);
      } else if (data.celebrityMatch) {
        // Direct analysis object (fallback)
        setStyleAnalysis(data);
      } else {
        throw new Error(data.error || "Analysis data not found");
      }
    } catch (err) {
      console.error("[Result] Style analysis error:", err);
      setAnalysisError(t("report.noData"));
    } finally {
      setAnalysisLoading(false);
    }
  }, [session?.access_token, hasStyleProfile, styleProfile, language, t, isAccessoryMode, accessoryCategory]);

  // Start style analysis immediately when session is ready (parallel with fitting)
  useEffect(() => {
    if (session?.access_token && hasStyleProfile && !analysisCalledRef.current) {
      fetchStyleAnalysis();
    }
  }, [session?.access_token, hasStyleProfile, fetchStyleAnalysis]);

  // Determine final success: fitting must be complete, and if style profile exists, analysis must also be complete
  useEffect(() => {
    if (fittingComplete && fittingImageUrl) {
      if (hasStyleProfile) {
        // Wait for style analysis to complete (success or error)
        if (!analysisLoading) {
          console.log("[Result] Both fitting and style analysis complete, showing results");
          setImageUrl(fittingImageUrl);
          setStatus("success");
        }
      } else {
        // No style profile, show result immediately
        console.log("[Result] No style profile, showing fitting result immediately");
        setImageUrl(fittingImageUrl);
        setStatus("success");
      }
    }
  }, [fittingComplete, fittingImageUrl, hasStyleProfile, analysisLoading]);

  const isLoading = isLoadingState;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={isAccessoryMode ? `/upload-accessory/${accessoryCategory}` : "/upload"} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t("result.retry")}</span>
          </Link>
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-20 animate-fade-in">
            {/* Full mode 2-step indicator - only show for separate mode */}
            {isTwoStepFullMode && (
              <div className="flex items-center justify-center gap-4 mb-8">
                {/* Step 1 */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep > 1 ? "bg-primary" : "gradient-primary animate-pulse"
                  }`}>
                    {currentStep > 1 ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Shirt className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
                    {t("result.step1") || "상의 교체"}
                  </span>
                </div>
                
                {/* Connector */}
                <div className={`w-12 h-0.5 ${currentStep > 1 ? "bg-primary" : "bg-muted"}`} />
                
                {/* Step 2 */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === 2 ? "gradient-primary animate-pulse" : "bg-muted"
                  }`}>
                    <Shirt className={`w-4 h-4 ${currentStep === 2 ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm font-medium ${currentStep === 2 ? "text-foreground" : "text-muted-foreground"}`}>
                    {t("result.step2") || "하의 교체"}
                  </span>
                </div>
              </div>
            )}

            {/* Loading Animation */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * progress) / 100}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(252, 100%, 60%)" />
                    <stop offset="100%" stopColor="hsl(320, 100%, 60%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold mb-2">
              {fittingComplete && hasStyleProfile && analysisLoading
                ? (language === "ko" ? "스타일 분석 중..." : "Analyzing your style...")
                : isTwoStepFullMode 
                  ? (currentStep === 1 
                      ? (t("result.step1Processing") || "상의 교체 중...") 
                      : (t("result.step2Processing") || "하의 교체 중..."))
                  : statusText}
            </h2>
            
            {/* Elapsed time and estimated time */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="w-4 h-4" />
              <span>
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </span>
              <span className="mx-2">|</span>
              <span>
                {isTwoStepFullMode 
                  ? (t("result.estimatedTimeFull") || "예상 소요: 1~2분")
                  : (t("result.estimatedTime") || "예상 소요: 30~60초")}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-4 max-w-xs mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isTwoStepFullMode 
                  ? `${currentStep}${t("result.stepLabel") || "단계"}: ${Math.round(currentStep === 1 ? progress : (progress - 50) * 2)}%` 
                  : `${Math.round(progress)}%`}
              </p>
            </div>
            {/* Fashion Tips */}
            <LoadingTips intervalMs={4000} />
            
            {/* Page leave warning notice */}
            <div className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg max-w-xs mx-auto">
              <p className="text-xs text-destructive text-center">
                {t("result.leaveWarningNotice")}
              </p>
            </div>
          </div>
        )}

        {status === "success" && imageUrl && (
          <div className="animate-scale-in">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {t("result.complete")} 🎉
              </h2>
              <p className="text-muted-foreground">
                {t("result.title")}
              </p>
            </div>

            {/* Tabs for Image and Report */}
            {hasStyleProfile ? (
              <Tabs defaultValue="image" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="image" className="gap-2">
                    <Image className="w-4 h-4" />
                    {t("result.imageTab")}
                  </TabsTrigger>
                  <TabsTrigger value="report" className="gap-2">
                    <FileText className="w-4 h-4" />
                    {t("result.reportTab")}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="image">
                  {/* Result Image */}
                  <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-lg mb-8">
                    <img
                      src={imageUrl}
                      alt="Virtual Try-On Result"
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      variant="gradient"
                      size="lg"
                      className="flex-1"
                      onClick={handleDownload}
                    >
                      <Download className="w-5 h-5" />
                      {t("result.download")}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={handleShare}
                    >
                      <Share2 className="w-5 h-5" />
                      {t("result.share")}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="report">
                  {/* Style Report Dashboard Notice */}
                  <div className="bg-accent border border-border rounded-xl p-4 mb-6">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ {t("result.reportDashboardNotice")}
                    </p>
                  </div>
                  <StyleAnalysisReport 
                    profile={styleProfile}
                    analysisData={styleAnalysis}
                    isLoading={analysisLoading}
                    error={analysisError}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <>
                {/* Result Image (No tabs if no profile) */}
                <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-lg mb-8">
                  <img
                    src={imageUrl}
                    alt="Virtual Try-On Result"
                    className="w-full h-auto"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="flex-1"
                    onClick={handleDownload}
                  >
                    <Download className="w-5 h-5" />
                    {t("result.download")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5" />
                    {t("result.share")}
                  </Button>
                </div>
              </>
            )}

            {/* Share Reward Section */}
            <div className="mt-8">
              <ShareRewardSection taskId={step2TaskId || taskId || null} resultImageUrl={imageUrl} />
            </div>

            {/* Try Again */}
            <div className="text-center mt-8">
              <Button
                variant="ghost"
                onClick={() => navigate("/upload")}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t("result.new")}
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <span className="text-4xl">😢</span>
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">
              {t("result.error")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {statusText}
            </p>
            
            {/* Error compensation guide */}
            <div className="bg-accent/50 border border-border rounded-xl p-4 mb-6 max-w-md mx-auto">
              <p className="text-sm text-foreground">
                💡 {t("result.errorGuide")}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => navigate(isAccessoryMode ? `/upload-accessory/${accessoryCategory}` : "/upload")}
                className="gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                {t("result.retry")}
              </Button>
              <Link to="/feedback">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t("result.contactUs")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Result;
