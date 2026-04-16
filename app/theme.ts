'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C4DFF',
      light: '#B47CFF',
      dark: '#5B30CC',
    },
    secondary: {
      main: '#00E5FF',
      light: '#6EFFFF',
      dark: '#00B2CC',
    },
    success: {
      main: '#69F0AE',
      light: '#B9F6CA',
      dark: '#00C853',
    },
    error: {
      main: '#FF5252',
      light: '#FF8A80',
      dark: '#D50000',
    },
    warning: {
      main: '#FFD740',
      light: '#FFE57F',
      dark: '#FFC400',
    },
    background: {
      default: '#0A0E1A',
      paper: '#111827',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body2: {
      color: '#94A3B8',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(124, 77, 255, 0.12)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(17, 24, 39, 0.8)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #7C4DFF 0%, #448AFF 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #651FFF 0%, #2979FF 100%)',
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(124, 77, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(124, 77, 255, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7C4DFF',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
