import { Card, CardContent, Typography, Box, Chip, IconButton, useTheme } from '@mui/material';
import { MoreVert as MoreIcon } from '@mui/icons-material';

interface ChangeCardProps {
  title: string;
  // url: string;
  timeAgo: string;
  tags: string[];
}

export default function ChangeCard({ title, timeAgo, tags }: ChangeCardProps) {
  const theme = useTheme();
  
  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'text':
        return theme.palette.primary.main;
      case 'style':
        return '#6f42c1';
      case 'applied':
        return '#28a745';
      default:
        return theme.palette.secondary.main;
    }
  };

  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, pr: 1 }}>
            {title}
          </Typography>
          <IconButton size="small" sx={{ p: 0.5 }}>
            <MoreIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        
        {/* <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {url}
        </Typography> */}
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {timeAgo}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              sx={{
                backgroundColor: getTagColor(tag),
                color: 'white',
                fontSize: '0.65rem',
                height: 20,
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
