import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { t } from "../../i18n";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h1" component="h1" gutterBottom>
                    404
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom>
                    {t('pagina_no_encontrada_2')}</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    {t('lo_sentimos_la_pagina_que_estas_buscando_no_existe_2')}</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/')}
                    sx={{ mt: 2 }}
                >
                    {t('volver_al_inicio_2')}</Button>
            </Box>
        </Container>
    );
};

export default NotFound; 