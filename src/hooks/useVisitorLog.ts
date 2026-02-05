 import { useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
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