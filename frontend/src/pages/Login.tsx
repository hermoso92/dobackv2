import EmailIcon from '@mui/icons-material/Email';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { useSafeTranslation } from '../hooks/useTranslationReady';
import { logger } from '../utils/logger';

export const Login: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const { t, isReady, isLoading: translationsLoading } = useSafeTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    // Mostrar loading mientras las traducciones se cargan
    if (translationsLoading || !isReady) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2
                }}
            >
                <CircularProgress size={60} sx={{ color: 'white' }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                    Cargando traducciones...
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
                position: 'relative',
                overflow: 'hidden'
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

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <BackButton sx={{ mb: 2 }} />

                <Grid container spacing={4} sx={{ minHeight: 'calc(100vh - 120px)' }}>
                    {/* Panel de Información - Columna Izquierda */}
                    <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Paper
                            elevation={6}
                            sx={{
                                height: '100%',
                                borderRadius: 3,
                                background: 'rgba(255, 255, 255, 0.95)',
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

                            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography
                                    component="h1"
                                    variant="h3"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#1565c0',
                                        mb: 2,
                                        fontSize: { md: '2rem', lg: '2.5rem' },
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <Box component="span" sx={{ fontSize: { md: '1.8rem', lg: '2.2rem' } }}>🚒</Box>
                                    Doback Soft V2
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#666',
                                        mb: 3,
                                        fontSize: { md: '1.1rem', lg: '1.2rem' }
                                    }}
                                >
                                    {t('login_marketing_product')}
                                </Typography>
                                <Divider sx={{ width: '100%', mb: 3 }} />

                                {/* Características */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: '#333',
                                            fontSize: { md: '1.1rem', lg: '1.2rem' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: 2
                                        }}
                                    >
                                        <InfoOutlinedIcon color="primary" sx={{ fontSize: 24 }} />
                                        <b>{t('login_feature_heading')}</b>
                                    </Typography>
                                    <Box
                                        component="ul"
                                        sx={{
                                            color: '#444',
                                            fontSize: { md: '1rem', lg: '1.1rem' },
                                            margin: 0,
                                            paddingLeft: 3,
                                            marginBottom: 3,
                                            lineHeight: 1.4,
                                            listStyleType: 'none'
                                        }}
                                    >
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>📍</Box>
                                            {t('login_feat_monitor')}
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>🔔</Box>
                                            {t('login_feat_alerts')}
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>📊</Box>
                                            {t('login_feat_reports')}
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>⚡</Box>
                                            {t('login_feat_security')}
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>🔐</Box>
                                            {t('login_feat_access')}
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Beneficios */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: '#333',
                                            fontSize: { md: '1.1rem', lg: '1.2rem' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: 2
                                        }}
                                    >
                                        <Box component="span" sx={{ fontSize: '1.2rem' }}>✨</Box>
                                        <b>{t('login_benefit_heading')}</b>
                                    </Typography>
                                    <Box
                                        component="ul"
                                        sx={{
                                            color: '#444',
                                            fontSize: { md: '0.95rem', lg: '1rem' },
                                            margin: 0,
                                            paddingLeft: 3,
                                            lineHeight: 1.6,
                                            listStyleType: 'none'
                                        }}
                                    >
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>📈</Box>
                                            {t('login_benefit_efficiency')}
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>💰</Box>
                                            {t('login_benefit_cost')}
                                        </Box>
                                        <Box component="li" sx={{ mb: 2, display: 'flex', alignItems: "center" }}>
                                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>🛡️</Box>
                                            {t('login_benefit_security')}
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
                                {t('login_footer_text')}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Panel de Login - Columna Derecha */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <LoginWithRegister />
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

// Componente interno con Tabs para Login y Registro
const LoginWithRegister: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { login, isLoading } = useAuth();
    const { t } = useSafeTranslation();

    // Estados para Login
    const [loginData, setLoginData] = useState({
        email: 'admin@cosigein.com',
        password: 'admin123'
    });

    // Estados para Registro
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'ADMIN' as 'ADMIN' | 'MANAGER' | 'USER'
    });
    const [isRegistering, setIsRegistering] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await login(loginData.email, loginData.password);
            logger.info('Login exitoso');
        } catch (err: any) {
            logger.error('Error en login:', err);
            setError('Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validaciones
        if (registerData.password !== registerData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (registerData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!registerData.username || !registerData.email || !registerData.firstName || !registerData.lastName) {
            setError('Todos los campos son obligatorios');
            return;
        }

        try {
            setIsRegistering(true);
            logger.info('Creando nuevo usuario...', { username: registerData.username });

            // Usar fetch directo para evitar problemas con apiService que requiere token
            const response = await fetch('http://localhost:9998/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: registerData.username,
                    email: registerData.email,
                    password: registerData.password,
                    firstName: registerData.firstName,
                    lastName: registerData.lastName,
                    role: registerData.role
                })
            });

            const data = await response.json();

            if (data.success) {
                logger.info('Usuario creado exitosamente');
                setSuccess(`✅ Usuario "${registerData.username}" creado exitosamente con rol ${registerData.role}!`);

                // Limpiar formulario
                setRegisterData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    firstName: '',
                    lastName: '',
                    role: 'ADMIN'
                });

                // Cambiar a la pestaña de login después de 2 segundos
                setTimeout(() => {
                    setActiveTab(0);
                    setSuccess(null);
                    setLoginData({
                        email: registerData.email,
                        password: ''
                    });
                }, 2000);
            } else {
                setError(data.message || 'Error al crear el usuario');
            }
        } catch (err: any) {
            logger.error('Error creando usuario:', err);
            const errorMessage = err.message || 'Error al crear el usuario';
            setError(errorMessage);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setError(null);
        setSuccess(null);
    };

    return (
        <Paper
            elevation={6}
            sx={{
                width: '100%',
                maxWidth: '500px',
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                p: 4
            }}
        >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                    <Tab
                        label="Iniciar Sesión"
                        icon={<PersonIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Crear Usuario"
                        icon={<PersonAddIcon />}
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {/* Pestaña de Login */}
            {activeTab === 0 && (
                <Box component="form" onSubmit={handleLogin} sx={{ pt: 2 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label={t('login_email')}
                        autoComplete="email"
                        autoFocus
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                        disabled={isLoading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label={t('login_password')}
                        type="password"
                        autoComplete="current-password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                        disabled={isLoading}
                        sx={{ mb: 3 }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : t('login_button')}
                    </Button>

                    <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Typography variant="caption" display="block">
                            💡 Credenciales por defecto:
                        </Typography>
                        <Typography variant="caption" display="block">
                            admin@cosigein.com / admin123
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Pestaña de Registro */}
            {activeTab === 1 && (
                <Box component="form" onSubmit={handleRegister} sx={{ pt: 2 }}>
                    <TextField
                        margin="dense"
                        required
                        fullWidth
                        label="Nombre de Usuario"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        disabled={isRegistering}
                    />
                    <TextField
                        margin="dense"
                        required
                        fullWidth
                        label="Email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        disabled={isRegistering}
                    />
                    <TextField
                        margin="dense"
                        required
                        fullWidth
                        label="Nombre"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        disabled={isRegistering}
                    />
                    <TextField
                        margin="dense"
                        required
                        fullWidth
                        label="Apellidos"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        disabled={isRegistering}
                    />
                    <TextField
                        margin="dense"
                        required
                        fullWidth
                        label="Contraseña"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        disabled={isRegistering}
                        helperText="Mínimo 6 caracteres"
                    />
                    <TextField
                        margin="dense"
                        required
                        fullWidth
                        label="Confirmar Contraseña"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        disabled={isRegistering}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={registerData.role}
                            label="Rol"
                            onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as any })}
                            disabled={isRegistering}
                        >
                            <MenuItem value="ADMIN">ADMIN - Acceso total</MenuItem>
                            <MenuItem value="MANAGER">MANAGER - Solo su empresa</MenuItem>
                            <MenuItem value="USER">USER - Acceso limitado</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isRegistering}
                        sx={{ mt: 3, py: 1.5, fontSize: '1rem', fontWeight: 600 }}
                    >
                        {isRegistering ? <CircularProgress size={24} /> : 'Crear Usuario'}
                    </Button>
                </Box>
            )}
        </Paper>
    );
};

export default Login;
