import { Box, Typography, Link, useTheme } from '@mui/material';
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
}

export default function RecentChanges({ history }: RecentChangesProps) {
  const theme = useTheme();
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

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
              url={item.url || 'Unknown URL'}
              timeAgo={formatTimeAgo(item.created_at)}
              tags={item.tags || ['applied']}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
