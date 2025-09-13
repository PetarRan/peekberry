// src/background.ts
import { supabase } from "./utils/supabase";

// Listen for messages from content scripts / popup / dashboard
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "SET_TOKEN") {
    // Store token & userId in extension storage
    await chrome.storage.local.set({
      token: msg.token,
      refreshToken: msg.refreshToken,
      userId: msg.userId,
    });
    console.log("Token saved in extension storage:", msg.token);

    // Initialize Supabase session in the extension
    supabase.auth.setSession({
      access_token: msg.token,
      refresh_token: msg.refreshToken,
    });
  }

  if (msg.type === "UPLOAD_SCREENSHOT") {
    const { token, refreshToken, userId } = await chrome.storage.local.get([
      "token",
      "refreshToken",
      "userId",
    ]);
    if (!token || !userId) return console.error("No token found!");

    // Make sure Supabase session is set
    supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });

    // Upload screenshot to Supabase Storage
    const filename = `user-${userId}/${Date.now()}.png`;
    const { data, error: storageError } = await supabase.storage
      .from("screenshots")
      .upload(filename, msg.dataUrl, { contentType: "image/png" });

    if (storageError) return console.error("Storage error:", storageError);

    // Insert screenshot record
    const { error: dbError } = await supabase
      .from("screenshots")
      .insert([{ user_id: userId, page_url: msg.pageUrl, image_url: data.path }]);

    if (dbError) console.error("DB error:", dbError);

    // Insert edit history
    const { error: histError } = await supabase
      .from("history")
      .insert([{ user_id: userId, prompt: msg.prompt, action: msg.action }]);

    if (histError) console.error("History error:", histError);

    console.log("Screenshot + history saved successfully!");
  }
});
