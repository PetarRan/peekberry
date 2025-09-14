import { Card, CardContent, Typography, Box, IconButton, useTheme } from '@mui/material';
import {
  Bolt as LightningIcon,
  Mouse as CursorIcon,
  AccessTime as ClockIcon,
  GpsFixed as TargetIcon,
} from '@mui/icons-material';

interface KPIData {
  changesMade: number;
  elementsModified: number;
  timeSaved: number;
  successRate: number;
  websitesCount: number;
}

interface KPICardsProps {
  data: KPIData;
}

export default function KPICards({ data }: KPICardsProps) {
  const theme = useTheme();
  
  const cards = [
    {
      title: 'Changes Made',
      value: data.changesMade,
      subtitle: 'This month',
      icon: <LightningIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />,
      trend: '+12%',
    },
    {
      title: 'Elements Modified',
      value: data.elementsModified,
      subtitle: `Across ${data.websitesCount} websites`,
      icon: <CursorIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />,
    },
    {
      title: 'Time Saved',
      value: `${data.timeSaved}h`,
      subtitle: 'Estimated dev time',
      icon: <ClockIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />,
      trend: '+8%',
    },
    {
      title: 'Success Rate',
      value: `${data.successRate}%`,
      subtitle: 'Changes applied successfully',
      icon: <TargetIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />,
    },
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 4 }}>
      {cards.map((card, index) => (
        <Card key={index} sx={{ p: 2 }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {card.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {card.value}
                </Typography>
                {card.trend && (
                  <Typography variant="caption" sx={{ color: '#28a745', fontSize: '0.7rem' }}>
                    {card.trend}
                  </Typography>
                )}
              </Box>
              <IconButton sx={{ p: 0 }}>
                {card.icon}
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {card.subtitle}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
