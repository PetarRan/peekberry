import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box, Typography, Button, CircularProgress, Alert, Switch, FormControlLabel } from '@mui/material'
import theme from '../../theme/theme'
import { AuthProvider, useAuth } from '../../shared/contexts/AuthContext'
import { ExtensionProvider, useExtension } from '../../shared/contexts/ExtensionContext'
import { AuthFlow } from './AuthFlow'

function PopupContent() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { 
    extensionState, 
    activateExtension, 
    deactivateExtension, 
    loading: extensionLoading, 
    error: extensionError 
  } = useExtension()

  if (authLoading || extensionLoading) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (!user) {
    return <AuthFlow />
  }

  const handleExtensionToggle = async () => {
    if (extensionState?.isActive) {
      await deactivateExtension()
    } else {
      await activateExtension()
    }
  }

  return (
    <Box sx={{ p: 2, width: 320 }}>
      <Typography variant="h6" component="h1" gutterBottom>
        Peekberry
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Welcome, {user.email}
      </Typography>
      
      {extensionError && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.75rem' }}>
          {extensionError}
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={extensionState?.isActive || false}
              onChange={handleExtensionToggle}
              disabled={extensionLoading}
            />
          }
          label={
            <Typography variant="body2">
              {extensionState?.isActive ? 'Extension Active' : 'Activate Extension'}
            </Typography>
          }
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {extensionState?.isActive 
          ? 'Extension is active. You can now interact with page elements.'
          : 'Toggle the switch above to activate Peekberry on the current page.'
        }
      </Typography>
      
      <Button 
        variant="outlined" 
        size="small" 
        onClick={signOut}
        fullWidth
      >
        Sign Out
      </Button>
    </Box>
  )
}

function Popup() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ExtensionProvider>
          <PopupContent />
        </ExtensionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<Popup />)