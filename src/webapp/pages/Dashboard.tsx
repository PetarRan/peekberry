import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Box, Container } from "@mui/material";
import { supabase } from "../../utils/supabase";
import Navbar from "../components/Navbar";
import WelcomeMessage from "../components/WelcomeMessage";
import KPICards from "../components/KPICards";
import ScreenshotGallery from "../components/ScreenshotGallery";
import RecentChanges from "../components/RecentChanges";

export default function Dashboard() {
  const { user } = useUser();
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingScreenshots, setLoadingScreenshots] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [kpiData] = useState({
    changesMade: 127,
    elementsModified: 89,
    timeSaved: 18.5,
    successRate: 94,
    websitesCount: 23,
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load screenshots
        setLoadingScreenshots(true);
        const { data: shots } = await supabase
          .from("screenshots")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setScreenshots(shots || []);
        setLoadingScreenshots(false);

        // Load history
        setLoadingHistory(true);
        const { data: hist } = await supabase
          .from("history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setHistory(hist || []);
        setLoadingHistory(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoadingScreenshots(false);
        setLoadingHistory(false);
      }
    };

    loadData();
  }, [user]);

  const handleSettingsChange = (settings: { autoSave: boolean; sharePrompts: boolean }) => {
    // Handle settings changes here
    console.log('Settings changed:', settings);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar onSettingsChange={handleSettingsChange} />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <WelcomeMessage userName={user.fullName || user.firstName || 'User'} />
        
        <KPICards data={kpiData} />
        
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '2', minWidth: '300px' }}>
            <ScreenshotGallery screenshots={screenshots} loading={loadingScreenshots} />
          </Box>
          <Box sx={{ flex: '1', minWidth: '300px' }}>
            <RecentChanges history={history} loading={loadingHistory} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}