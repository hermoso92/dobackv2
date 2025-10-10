import { Box, Link, Typography } from '@mui/material';
import React from 'react';
import { t } from "../../i18n";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        {'© '}
        <Link color="inherit" href="https://DobackSoft.com">
          {t('DobackSoft_v2_2')}</Link>{' '}
        {new Date().getFullYear()}
        {'. Todos los derechos reservados.'}
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        <Link color="inherit" href="/privacy">
          {t('politica_de_privacidad')}</Link>{' '}
        {' | '}
        <Link color="inherit" href="/terms">
          {t('terminos_de_uso')}</Link>{' '}
        {' | '}
        <Link color="inherit" href="/contact">
          {t('contacto')}</Link>
      </Typography>
    </Box>
  );
};

export default Footer; 