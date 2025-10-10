import { Alert, Box, Button, Container, Paper, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';

const EnhancedLogin: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Por favor, completa todos los campos');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await login(email, password);
            logger.info('Login exitoso');
            // La redirección se manejará automáticamente por el contexto
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
            logger.error('Error en login:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: '100%',
                        maxWidth: 400
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            DobackSoft
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Sistema de Gestión de Flotas
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                            autoComplete="email"
                            autoFocus
                        />

                        <TextField
                            fullWidth
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            autoComplete="current-password"
                        />

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </form>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Credenciales de prueba:
                        </Typography>
                        <Typography variant="caption" display="block">
                            Email: admin@dobacksoft.com
                        </Typography>
                        <Typography variant="caption" display="block">
                            Contraseña: admin123
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default EnhancedLogin;
