import { createTheme } from "@mui/material/styles";

// Define your color palette
const palette = {
  primary: {
    main: "#6C757D", // Grey as primary
    dark: "#495057",
    light: "#ADB5BD",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#6C757D", // Grey color
    light: "#E9ECEF",
    dark: "#495057",
    contrastText: "#FFFFFF", // White text for dark buttons
  },
  text: {
    primary: "#2c2c2c", // Dark grey text
    secondary: "#6C757D",
  },
  background: {
    default: "#fafafa", // Bone-ish white background
    paper: "#f5f5f5", // Slightly greyer for cards
  },
  divider: "#E9ECEF",
  // Dark mode colors
  dark: {
    background: "#00000099", // Semi-transparent black
    paper: "#1a1a1a", // Slightly greyer for cards
    text: "#FFFFFA99", // Light grey text
    divider: "#333333",
  },
};

// Create the theme
const theme = createTheme({
  palette,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: "1.4rem", // Reduced from 2rem
    },
    body1: {
      fontSize: "0.9rem", // Reduced from 1rem
    },
    body2: {
      fontSize: "0.8rem", // Reduced from 0.875rem
    },
    caption: {
      fontSize: "0.7rem", // Reduced from 0.75rem
    },
  },
  // Add the MuiDialog component styling to the components section
  components: {
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          borderBottom: "none",
          padding: 16,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          border: "none",
          padding: 16,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          borderTop: "none",
          padding: 16,
        },
      },
    },
    // Add Card component styling
    MuiCard: {
      defaultProps: {
        elevation: 0, // Default elevation of 0
      },
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          border: `1px solid ${palette.divider}`, // Border color matching divider
          borderRadius: 10, // Matching your theme's border radius
          padding: 10, // Padding of 2 (16px)
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: 10,
          padding: 0.5,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          border: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "150px",
          styleOverrides: {
            root: {
              border: "none",
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        // Add styles for the secondary outlined button
        outlinedSecondary: {
          color: "#212529", // Black/very dark grey text color
          borderColor: "#ced4da", // Light grey border color
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)", // Standard light grey hover background
            borderColor: "#adb5bd", // Slightly darker border on hover (optional)
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "#fff",
          "& .MuiInputBase-root": {
            borderRadius: 10,
            padding: "2px 8px",
          },
        },
      },
      defaultProps: {
        variant: "outlined",
        size: "small",
        fullWidth: true,
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: palette.divider,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: "none",
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        PaperProps: {
          sx: {
            borderRadius: 4,
            py: 0.5,
            px: 0.5,
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        ".react-grid-item": {
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        },
        ".react-resizable-handle": {
          backgrounColor: "transparent",
        },
        ".react-resizable-handle::after": {
          borderColor: `${palette.primary.main}`,
        },
        ".react-grid-item.react-grid-placeholder": {
          background: `${palette.primary.main}`,
          borderRadius: 4,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.background.default,
          color: palette.text.primary,
          boxShadow: 'none',
          borderBottom: `1px solid ${palette.divider}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.background.paper,
          borderLeft: `1px solid ${palette.divider}`,
        },
      },
    },
  },
});

export default theme;
