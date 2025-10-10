import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { REPORTS_ENDPOINTS, STABILITY_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { t } from '../i18n';
import { authService } from '../services/auth';
import { logger } from '../utils/logger';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setAuthError('No hay sesion activa');
          setIsVerifying(false);
          navigate('/login', { replace: true });
        }
        return;
      }

      try {
        logger.info('Dashboard: verificando sesion activa');
        setIsVerifying(true);
        setAuthError(null);

        const response = await authService.verifyToken();
        if (!response.success && isMounted) {
          setAuthError('Error al verificar la sesion');
          await logout();
          navigate('/login', { replace: true });
        }
      } catch (error) {
        logger.error('Dashboard: error verificando autenticacion', {
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
        if (isMounted) {
          setAuthError('Error al verificar la sesion');
          await logout();
          navigate('/login', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, logout, navigate]);

  const handleRegenerateAll = async () => {
    setRegenLoading(true);
    setRegenFeedback(null);
    try {
      const response = await axios.post(STABILITY_ENDPOINTS.REGENERATE_ALL);
      const totalSessions = response.data?.totalRegeneradas ?? 0;
      const totalEvents = response.data?.totalEventos ?? 0;
      setRegenFeedback(`Regeneradas: ${totalSessions} sesiones, eventos: ${totalEvents}`);
    } catch (error) {
      logger.error('Error al regenerar eventos', { error });
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : 'Error al regenerar eventos';
      setRegenFeedback(message);
    } finally {
      setRegenLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    setPdfFeedback(null);

    try {
      logger.info('Dashboard: iniciando generación de PDF global');

      const response = await axios.post(REPORTS_ENDPOINTS.GENERATE_PDF, {
        type: 'global_dashboard',
        includeMetrics: true,
        includeCharts: true,
        includeVehicleStats: true,
        includeAlarmStats: true,
        organizationId: localStorage.getItem('organizationId') || null
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });

      // Crear URL del blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-global-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setPdfFeedback('PDF generado y descargado exitosamente');
      logger.info('Dashboard: PDF generado exitosamente');

    } catch (error) {
      logger.error('Dashboard: error generando PDF', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });

      const message = axios.isAxiosError(error) && error.response?.data?.error
        ? String(error.response.data.error)
        : 'Error al generar PDF. Verifique que el servicio de reportes esté disponible.';

      setPdfFeedback(message);
    } finally {
      setPdfLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (authError) {
    return (
      <Box p={3}>
        <Alert severity="error">{authError}</Alert>
      </Box>
    );
  }

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (statsError) {
    return (
      <Box p={3}>
        <Alert severity="error">{statsError}</Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box p={3}>
        <Alert severity="warning">{t('no_hay_datos_disponibles')}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3} data-testid="dashboard-content">
      <Typography variant="h4" gutterBottom>
        {t('dashboard')}
      </Typography>

      {isAdmin() && (
        <Stack direction="row" spacing={2} mb={2}>
          <Button
            variant="contained"
            color="error"
            onClick={handleRegenerateAll}
            disabled={regenLoading}
          >
            {regenLoading ? 'Regenerando eventos...' : 'Regenerar eventos de todas las sesiones'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generando PDF...' : 'Generar PDF de todas las sesiones'}
          </Button>
        </Stack>
      )}

      {regenFeedback && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {regenFeedback}
        </Alert>
      )}
      {pdfFeedback && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {pdfFeedback}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('vehiculos')}
              </Typography>
              <Typography variant="h5">{stats.totalVehicles}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('sesiones')}
              </Typography>
              <Typography variant="h5">{stats.activeVehicles}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('alertas')}
              </Typography>
              <Typography variant="h5">{stats.totalAlerts}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('alertas_activas')}
              </Typography>
              <Typography variant="h5">{stats.activeAlerts}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
