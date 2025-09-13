import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

export default function Dashboard() {
  const { user } = useUser();
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const sendToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      chrome.runtime.sendMessage({
        type: "SET_TOKEN",
        token: session?.access_token,
        refreshToken: session?.refresh_token,
        userId: user.id,
      });
    };

    sendToken();

    const loadData = async () => {
      const { data: shots } = await supabase
        .from("screenshots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data: hist } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setScreenshots(shots || []);
      setHistory(hist || []);
    };

    loadData();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Welcome, {user?.fullName}</h1>

      <section>
        <h2 className="text-xl mb-2">📸 Screenshots</h2>
        <div className="grid grid-cols-3 gap-2">
          {screenshots.map((s) => (
            <img key={s.id} src={s.image_url} alt="screenshot" className="rounded" />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl mb-2">📝 Edit History</h2>
        <ul className="list-disc pl-5">
          {history.map((h) => (
            <li key={h.id}>
              <strong>{h.prompt}</strong> → {h.action}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}