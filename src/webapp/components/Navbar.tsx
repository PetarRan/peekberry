import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Help as HelpIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useUser, useClerk } from '@clerk/clerk-react';

interface NavbarProps {
  onSettingsChange?: (settings: { autoSave: boolean; sharePrompts: boolean }) => void;
}

export default function Navbar({ onSettingsChange }: NavbarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const theme = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [sharePrompts, setSharePrompts] = useState(false);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleSignOut = () => {
    signOut();
    handleUserMenuClose();
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleAutoSaveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setAutoSave(newValue);
    onSettingsChange?.({ autoSave: newValue, sharePrompts });
  };

  const handleSharePromptsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setSharePrompts(newValue);
    onSettingsChange?.({ autoSave, sharePrompts: newValue });
  };

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', borderBottom: '1px solid #E9ECEF' }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.dark,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img 
                src="../assets/logo.avif" 
                alt="Peekberry Logo" 
                style={{ width: 24, height: 24 }}
              />
            </Box>
            <Typography variant="h6" sx={{ color: '#212529', fontWeight: 600 }}>
              Peekberry
            </Typography>
            <Typography variant="body2" sx={{ color: '#6C757D', ml: 1 }}>
              AI-Powered DOM Editor
            </Typography>
          </Box>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => {}} sx={{ color: '#6C757D' }}>
              <HelpIcon />
            </IconButton>
            <IconButton onClick={handleSettingsOpen} sx={{ color: '#6C757D' }}>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
              <Avatar 
                src={user?.imageUrl} 
                sx={{ width: 32, height: 32 }}
              >
                {user?.fullName?.charAt(0)}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleSignOut}>
          <Typography variant="body2">Sign Out</Typography>
        </MenuItem>
      </Menu>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={handleSettingsClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            p: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Settings</Typography>
          <IconButton onClick={handleSettingsClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <List>
          <ListItem>
            <ListItemIcon>
              <SaveIcon />
            </ListItemIcon>
            <FormControlLabel
              control={
                <Switch
                  checked={autoSave}
                  onChange={handleAutoSaveChange}
                  color="primary"
                />
              }
              label="Auto save history"
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <AnalyticsIcon />
            </ListItemIcon>
            <FormControlLabel
              control={
                <Switch
                  checked={sharePrompts}
                  onChange={handleSharePromptsChange}
                  color="primary"
                />
              }
              label="Share prompts for analytics"
            />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
