import { supabase } from "../../config/supabase";

export const handleOAuthCallback = async (): Promise<boolean> => {
  try {
    // Check if we're in an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth callback error:", error);
        return false;
      }

      if (data.session) {
        console.log("OAuth login successful");
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error handling OAuth callback:", error);
    return false;
  }
};

export const isOAuthCallback = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has("code");
};
