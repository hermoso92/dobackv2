import {
    Alert,
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            console.log('Intentando iniciar sesión...');
            console.log(`Email: ${email}, Contraseña: ${password.replace(/./g, '*')}`);

            // Para pruebas: simulamos un login exitoso
            if (email === 'admin@DobackSoft.com' && password === 'password') {
                // Login exitoso - modo de prueba
                console.log('Login exitoso (modo prueba)');
                localStorage.setItem('token', 'test-token-123456');
                localStorage.setItem('user', JSON.stringify({
                    id: '1',
                    email: 'admin@DobackSoft.com',
                    name: 'Administrador',
                    role: 'ADMIN'
                }));

                // Esperar un poco para simular la respuesta del servidor
                setTimeout(() => {
                    setLoading(false);
                    navigate('/dashboard');
                }, 1000);
                return;
            }

            // Intento de login real al backend
            const response = await fetch('http://localhost:9998/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Credenciales inválidas');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setLoading(false);
            navigate('/dashboard');
        } catch (err) {
            console.error('Error en el login:', err);
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography component="h1" variant="h5">
                        DobackSoft V2
                    </Typography>
                    <Typography component="h2" variant="subtitle1" sx={{ mt: 1 }}>
                        Sistema de Monitorización de Estabilidad
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Contraseña"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>

                        {/* Botón de ayuda para autocompletar credenciales */}
                        <Button
                            type="button"
                            fullWidth
                            variant="outlined"
                            color="secondary"
                            onClick={() => {
                                setEmail('admin@DobackSoft.com');
                                setPassword('password');
                            }}
                            sx={{ mt: 1 }}
                        >
                            Usar credenciales de prueba
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}; 