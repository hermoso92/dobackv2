import EmailIcon from '@mui/icons-material/Email';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Divider,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

const Login: React.FC = () => {
    const [email, setEmail] = useState('admin@cosigein.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState<string | null>(null);
    const { login, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        logger.info('Submit del formulario ejecutado');
        logger.info('Valores enviados:', { email, password });
        try {
            logger.info('Intentando iniciar sesión con:', email);
            const success = await login(email, password);
            if (!success) {
                setError('Credenciales inválidas');
            }
        } catch (err) {
            logger.error('Error en login:', err);
            setError('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
        }
    };

    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Elementos decorativos de fondo */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    pointerEvents: 'none'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                }}
            />

            <Container
                maxWidth={false}
                sx={{
                    height: '100%',
                    maxWidth: '100% !important',
                    px: { xs: 2, sm: 3, md: 4 }
                }}
            >
                <BackButton sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', height: '100%', maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Panel de Información */}
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            width: { md: '50%' },
                            height: '100%'
                        }}
                    >
                        <Paper
                            elevation={6}
                            sx={{
                                height: '100%',
                                borderRadius: 3,
                                background: 'rgba(255, 255, 255, 0.95)',
                                display: 'flex',
                                flexDirection: 'column',
                                p: 4,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Elemento decorativo */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -50,
                                    right: -50,
                                    width: '200px',
                                    height: '200px',
                                    background: 'radial-gradient(circle at center, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
                                    borderRadius: '50%',
                                    pointerEvents: 'none'
                                }}
                            />

                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography
                                    component="h1"
                                    variant="h3"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#1565c0',
                                        mb: 2,
                                        fontSize: { md: '2.5rem', lg: '3rem' },
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <Box component="span" sx={{ fontSize: { md: '2.2rem', lg: '2.5rem' } }}>🚒</Box>
                                    Doback Soft V2
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#666',
                                        mb: 3,
                                        fontSize: { md: '1.2rem', lg: '1.4rem' }
                                    }}
                                >
                                    Plataforma integral para la gestión y monitoreo inteligente de flotas y vehículos.
                                </Typography>
                                <Divider sx={{ width: '100%', mb: 3 }} />

                                {/* Sección de Características */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: '#333',
                                            fontSize: { md: '1.2rem', lg: '1.4rem' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: 2
                                        }}
                                    >
                                        <InfoOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
                                        <b>Características Principales</b>
                                    </Typography>
                                    <Box
                                        component="ul"
                                        sx={{
                                            color: '#444',
                                            fontSize: { md: '1.1rem', lg: '1.2rem' },
                                            margin: 0,
                                            paddingLeft: 3,
                                            marginBottom: 3,
                                            lineHeight: 1.4,
                                            listStyleType: 'none'
                                        }}
                                    >
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>📍</Box>
                                            Monitorear el estado y ubicación de tus vehículos.
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>🔔</Box>
                                            Gestionar alertas, eventos y mantenimientos de forma centralizada.
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>📊</Box>
                                            Visualizar reportes avanzados y análisis de estabilidad.
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>⚡</Box>
                                            Optimizar la seguridad y eficiencia operativa de tu flota.
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>🔐</Box>
                                            Acceso seguro y personalizado para cada usuario.
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Sección de Beneficios */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: '#333',
                                            fontSize: { md: '1.2rem', lg: '1.4rem' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: 2
                                        }}
                                    >
                                        <Box component="span" sx={{ fontSize: '1.4rem' }}>✨</Box>
                                        <b>Beneficios</b>
                                    </Typography>
                                    <Box
                                        component="ul"
                                        sx={{
                                            color: '#444',
                                            fontSize: { md: '1rem', lg: '1.1rem' },
                                            margin: 0,
                                            paddingLeft: 3,
                                            lineHeight: 1.8,
                                            listStyleType: 'none'
                                        }}
                                    >
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>📈</Box>
                                            Aumento de la eficiencia operativa
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>💰</Box>
                                            Reducción de costos operativos
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>🛡️</Box>
                                            Mayor seguridad y control
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#666',
                                    textAlign: 'center',
                                    fontSize: { md: '1rem', lg: '1.1rem' },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1
                                }}
                            >
                                <Box component="span" sx={{ fontSize: '1.2rem' }}>🚗</Box>
                                Plataforma desarrollada por Cosigein SL para la gestión moderna de movilidad y transporte.
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Panel de Login */}
                    <Box
                        sx={{
                            width: { xs: '100%', md: '50%' },
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Paper
                            elevation={6}
                            sx={{
                                width: '100%',
                                maxWidth: '500px',
                                borderRadius: 3,
                                background: 'rgba(255, 255, 255, 0.95)',
                                p: { xs: 3, sm: 4, md: 5 },
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Elemento decorativo */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -30,
                                    right: -30,
                                    width: '150px',
                                    height: '150px',
                                    background: 'radial-gradient(circle at center, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
                                    borderRadius: '50%',
                                    pointerEvents: 'none'
                                }}
                            />

                            <Box sx={{ mb: 4, textAlign: 'center' }}>
                                <Typography
                                    component="h1"
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#1565c0',
                                        mb: 2,
                                        fontSize: { xs: '1.8rem', sm: '2rem', md: '2.2rem' },
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1
                                    }}
                                >
                                    <Box component="span" sx={{ fontSize: '1.4rem' }}>👋</Box>
                                    Bienvenido
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        color: '#666',
                                        fontSize: { xs: '1rem', sm: '1.1rem' }
                                    }}
                                >
                                    Ingresa tus credenciales para acceder a la plataforma
                                </Typography>
                            </Box>

                            {error && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 3,
                                        borderRadius: 2,
                                        '& .MuiAlert-icon': {
                                            fontSize: '1.2rem'
                                        }
                                    }}
                                >
                                    {error}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleSubmit}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="email"
                                    label="Correo electrónico"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    disabled={isLoading}
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    disabled={isLoading}
                                    sx={{
                                        mb: 4,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    sx={{
                                        py: 2,
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        boxShadow: theme.shadows[4],
                                        '&:hover': {
                                            boxShadow: theme.shadows[8]
                                        }
                                    }}
                                    disabled={isLoading}
                                    startIcon={isLoading ? <CircularProgress size={22} color="inherit" /> : null}
                                >
                                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Login; 