import React, { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper
} from '@mui/material'
import { useAuth } from '../../shared/contexts/AuthContext'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export const AuthFlow: React.FC = () => {
  const { signIn, signUp, loading, error } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    setLocalError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLocalError(null)

    if (!email || !password) {
      setLocalError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    try {
      if (tabValue === 0) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setLocalError(null)
        // Show success message for sign up
        setLocalError('Check your email for verification link')
      }
    } catch (err) {
      // Error is handled by the context
    }
  }

  const displayError = localError || error

  return (
    <Paper elevation={0} sx={{ width: 320, p: 2 }}>
      <Typography variant="h6" component="h1" gutterBottom align="center">
        Welcome to Peekberry
      </Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="Sign In" />
        <Tab label="Sign Up" />
      </Tabs>

      <form onSubmit={handleSubmit}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
              helperText="Minimum 6 characters"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </Box>
        </TabPanel>
      </form>

      {displayError && (
        <Alert 
          severity={localError === 'Check your email for verification link' ? 'success' : 'error'} 
          sx={{ mt: 2 }}
        >
          {displayError}
        </Alert>
      )}
    </Paper>
  )
}