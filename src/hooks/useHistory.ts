import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { DEMO_CONFIG } from "../config/demo";

interface HistoryItem {
  id: string;
  user_id: string;
  prompt: string;
  action: string;
  created_at: string;
}

export const useHistory = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use hardcoded user ID for demo
      const userId = DEMO_CONFIG.USER_ID;
      console.log("Using hardcoded user ID:", userId);

      // Fetch history from Supabase
      const { data, error: dbError } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (dbError) {
        console.error("Error fetching history:", dbError);
        setError("Failed to fetch history");
        return;
      }

      setHistoryItems(data || []);
    } catch (err) {
      console.error("Error in fetchHistory:", err);
      setError("Failed to fetch history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    historyItems,
    isLoading,
    error,
    refetch: fetchHistory,
  };
};
