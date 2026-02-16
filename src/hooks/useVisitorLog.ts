import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_DOMAINS = [
  "localhost",
  "style-snap-show-40.lovable.app",
  "id-preview--12cf4c5b-462f-47c5-ac25-c366b2078bf5.lovable.app",
  "trupickai.com",
  "www.trupickai.com",
];

const isAllowedDomain = (): boolean => {
  try {
    const hostname = window.location.hostname;
    return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

const getSessionId = (): string => {
   const key = "visitor_session_id";
   let sessionId = sessionStorage.getItem(key);
   if (!sessionId) {
     sessionId = crypto.randomUUID();
     sessionStorage.setItem(key, sessionId);
   }
   return sessionId;
 };
 
export const useVisitorLog = (pagePath: string = "/") => {
  useEffect(() => {
    const logVisit = async () => {
      if (!isAllowedDomain()) {
        return;
      }
      
      const sessionId = getSessionId();
       const sessionKey = `visited_${pagePath}`;
       
       // Prevent duplicate logging for same page in same session
       if (sessionStorage.getItem(sessionKey)) {
         return;
       }
       
       try {
         const { data: { user } } = await supabase.auth.getUser();
         
         await supabase.from("visitor_logs").insert({
           session_id: sessionId,
           page_path: pagePath,
           user_id: user?.id || null,
           user_agent: navigator.userAgent,
           referrer: document.referrer || null,
         });
         
         sessionStorage.setItem(sessionKey, "true");
       } catch (error) {
         // Silently fail - visitor logging should not break the app
         console.error("Failed to log visit:", error);
       }
     };
     
     logVisit();
   }, [pagePath]);
 };