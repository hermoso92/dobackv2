import { logger } from '../utils/logger';
import {
    Edit as EditIcon,
    ExitToApp as LogoutIcon,
    Person as PersonIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    IconButton,
    TextField,
    Typography
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { t } from "../i18n";

const Perfil = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || '',
        position: user?.position || ''
    });

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            logger.error('Error al cerrar sesión:', error);
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            setEditData({
                name: user?.name || '',
                email: user?.email || '',
                phone: user?.phone || '',
                department: user?.department || '',
                position: user?.position || ''
            });
        }
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        try {
            logger.info('Guardando cambios del perfil:', editData);
            setIsEditing(false);
            alert('Perfil actualizado correctamente');
        } catch (error) {
            logger.error('Error al actualizar perfil:', error);
            alert('Error al actualizar el perfil');
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Box sx={{ minHeight: '100%', overflowX: 'hidden', overflowY: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    {t('mi_perfil')}
                </Typography>
                <IconButton
                    color="primary"
                    onClick={handleEditToggle}
                    title={isEditing ? "Cancelar edición" : "Editar perfil"}
                >
                    <EditIcon />
                </IconButton>
            </Box>

            <Grid container spacing={3}>
                {/* Información básica */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 100,
                                    height: 100,
                                    margin: '0 auto 16px auto',
                                    bgcolor: 'primary.main'
                                }}
                            >
                                <PersonIcon sx={{ fontSize: 60 }} />
                            </Avatar>

                            {isEditing ? (
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={editData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                            ) : (
                                <Typography variant="h5" gutterBottom>
                                    {user?.name}
                                </Typography>
                            )}

                            {isEditing ? (
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={editData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {user?.email}
                                </Typography>
                            )}

                            <Typography
                                variant="body2"
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    py: 0.5,
                                    px: 2,
                                    borderRadius: 1,
                                    display: 'inline-block',
                                    mt: 1
                                }}
                            >
                                {user?.role}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Información adicional editable */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Información Adicional
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Teléfono"
                                        value={editData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        disabled={!isEditing}
                                        variant={isEditing ? "outlined" : "standard"}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Departamento"
                                        value={editData.department}
                                        onChange={(e) => handleInputChange('department', e.target.value)}
                                        disabled={!isEditing}
                                        variant={isEditing ? "outlined" : "standard"}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Cargo/Posición"
                                        value={editData.position}
                                        onChange={(e) => handleInputChange('position', e.target.value)}
                                        disabled={!isEditing}
                                        variant={isEditing ? "outlined" : "standard"}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Acciones */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {t('acciones_5')}
                            </Typography>

                            <Grid container spacing={2}>
                                {isEditing ? (
                                    <>
                                        <Grid item xs={12} sm={4}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="primary"
                                                onClick={handleSave}
                                                startIcon={<SaveIcon />}
                                            >
                                                Guardar Cambios
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                color="secondary"
                                                onClick={handleEditToggle}
                                            >
                                                Cancelar
                                            </Button>
                                        </Grid>
                                    </>
                                ) : (
                                    <Grid item xs={12} sm={6}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="primary"
                                            onClick={handleEditToggle}
                                            startIcon={<EditIcon />}
                                        >
                                            {t('editar_perfil')}
                                        </Button>
                                    </Grid>
                                )}

                                <Grid item xs={12} sm={isEditing ? 4 : 6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        onClick={handleLogout}
                                        startIcon={<LogoutIcon />}
                                    >
                                        {t('cerrar_sesion_4')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Perfil; 