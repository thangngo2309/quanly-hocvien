import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f6fa',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
});