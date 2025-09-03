import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box, Typography } from '@mui/material'
import theme from '@/theme/theme'

function Popup() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="h1" gutterBottom>
          Peekberry
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Chrome extension for ephemeral UI modifications
        </Typography>
      </Box>
    </ThemeProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<Popup />)