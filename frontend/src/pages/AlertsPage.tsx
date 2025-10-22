/**
 * AlertsPage - Página de Alertas
 * Accesible por ADMIN y MANAGER desde /alerts
 */

import { Box, Container, Typography } from '@mui/material';
import React from 'react';
import AlertSystemManager from '../components/alerts/AlertSystemManager';
import FilteredPageWrapper from '../components/filters/FilteredPageWrapper';

const AlertsPage: React.FC = () => {
    return (
        <FilteredPageWrapper>
            <Container maxWidth="xl">
                <Box sx={{ py: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        🚨 Sistema de Alertas
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                        Gestión de alertas de archivos faltantes
                    </Typography>

                    <AlertSystemManager />
                </Box>
            </Container>
        </FilteredPageWrapper>
    );
};

export default AlertsPage;

