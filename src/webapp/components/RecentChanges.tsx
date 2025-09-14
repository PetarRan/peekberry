import { Box, Typography, Link, useTheme, Skeleton } from '@mui/material';
import ChangeCard from './ChangeCard';

interface HistoryItem {
  id: string;
  prompt: string;
  action: string;
  url: string;
  created_at: string;
  tags: string[];
}

interface RecentChangesProps {
  history: HistoryItem[];
  loading?: boolean;
}

export default function RecentChanges({ history, loading = false }: RecentChangesProps) {
  const theme = useTheme();
  
  const formatTimeAgo = (dateString: string) => {
    // Parse the UTC date string and convert to local time
    const utcDate = new Date(dateString + 'Z'); // Ensure it's treated as UTC
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - utcDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Changes
          </Typography>
          <Skeleton variant="text" width={60} height={20} />
        </Box>
        
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Recent Changes
        </Typography>
        <Link 
          href="#" 
          sx={{ 
            fontSize: '0.875rem', 
            textDecoration: 'none',
            color: theme.palette.primary.main,
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          View All
        </Link>
      </Box>
      
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No changes yet
          </Typography>
        ) : (
          history.map((item) => (
            <ChangeCard
              key={item.id}
              title={item.prompt}
              // url={item.url || 'Unknown URL'}
              timeAgo={formatTimeAgo(item.created_at)}
              tags={item.tags || ['applied']}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
