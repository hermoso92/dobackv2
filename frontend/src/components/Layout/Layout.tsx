import {
  Menu as MenuIcon
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  Toolbar,
  Typography,
  useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from "../../i18n";

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // --- ELIMINADO: Drawer lateral con navegación global ---
  // Solo debe quedar la AppBar superior para navegación.
  // --- Fin de eliminación ---

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
          left: 0,
          right: 0,
          margin: 0,
          padding: 0
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', width: '100%', margin: 0, padding: '0 16px' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('doback_soft')}</Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
          backgroundColor: theme.palette.background.default,
          pt: '56px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}; 