import { supabase } from "./supabase";
import { DEMO_CONFIG } from "../config/demo";

// Direct Supabase operations for demo
export const saveHistoryToSupabase = async (prompt: string, action: string) => {
  try {
    const { data, error } = await supabase
      .from("history")
      .insert([
        {
          user_id: DEMO_CONFIG.USER_ID,
          prompt: prompt,
          action: action,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error saving history:", error);
      return false;
    }

    console.log("History saved successfully:", data);
    return true;
  } catch (err) {
    console.error("Error in saveHistoryToSupabase:", err);
    return false;
  }
};

export const saveScreenshotToSupabase = async (
  pageUrl: string,
  base64Data: string
) => {
  try {
    const { error } = await supabase
      .from("screenshots")
      .insert([
        {
          user_id: DEMO_CONFIG.USER_ID,
          page_url: pageUrl,
          image_url: base64Data, // Store base64 data directly
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error("Error saving screenshot:", error);
      return false;
    }

    console.log("Screenshot saved successfully");
    return true;
  } catch (err) {
    console.error("Error in saveScreenshotToSupabase:", err);
    return false;
  }
};
