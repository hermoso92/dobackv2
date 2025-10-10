import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { Alarm } from '../types/alarm';
import { logger } from '../utils/logger';
import { t } from "../i18n";

interface AlarmManagerProps {
    alarms: Alarm[];
    onAddAlarm: (alarm: Omit<Alarm, 'id'>) => Promise<void>;
    onEditAlarm: (alarm: Alarm) => Promise<void>;
    onDeleteAlarm: (alarmId: number) => Promise<void>;
}

interface FormErrors {
    name?: string;
    threshold?: string;
    description?: string;
}

export const AlarmManager: React.FC<AlarmManagerProps> = ({
    alarms,
    onAddAlarm,
    onEditAlarm,
    onDeleteAlarm
}) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
    const [formData, setFormData] = useState<Omit<Alarm, 'id'>>({
        name: '',
        type: 'LTR',
        condition: 'greater',
        threshold: 0,
        enabled: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (!formData.name.trim()) {
            errors.name = 'El nombre es requerido';
        } else if (formData.name.length > 50) {
            errors.name = 'El nombre no puede tener más de 50 caracteres';
        }

        if (isNaN(formData.threshold)) {
            errors.threshold = 'El umbral debe ser un número válido';
        } else {
            const minThreshold = formData.type === 'LTR' ? 0 :
                formData.type === 'ROLL_ANGLE' ? -90 : -10;
            const maxThreshold = formData.type === 'LTR' ? 1 :
                formData.type === 'ROLL_ANGLE' ? 90 : 10;

            if (formData.threshold < minThreshold || formData.threshold > maxThreshold) {
                errors.threshold = `El umbral debe estar entre ${minThreshold} y ${maxThreshold}`;
            }
        }

        if (formData.description.length > 200) {
            errors.description = 'La descripción no puede tener más de 200 caracteres';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleOpenDialog = (alarm?: Alarm) => {
        setSubmitError(null);
        setFormErrors({});
        if (alarm) {
            setEditingAlarm(alarm);
            setFormData({
                name: alarm.name,
                type: alarm.type,
                condition: alarm.condition,
                threshold: alarm.threshold,
                enabled: alarm.enabled,
                description: alarm.description,
                createdAt: alarm.createdAt,
                updatedAt: alarm.updatedAt
            });
        } else {
            setEditingAlarm(null);
            setFormData({
                name: '',
                type: 'LTR',
                condition: 'greater',
                threshold: 0,
                enabled: true,
                description: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingAlarm(null);
        setFormErrors({});
        setSubmitError(null);
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            if (editingAlarm) {
                await onEditAlarm({
                    ...editingAlarm,
                    ...formData,
                    updatedAt: new Date().toISOString()
                });
            } else {
                await onAddAlarm(formData);
            }
            handleCloseDialog();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar la alarma';
            logger.error('Error al guardar la alarma:', { error });
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (alarmId: number) => {
        try {
            await onDeleteAlarm(alarmId);
        } catch (error) {
            logger.error('Error al eliminar la alarma:', { error, alarmId });
        }
    };

    return (
        <Box>
            <Stack spacing={2}>
                <Box display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpenDialog()}
                    >
                        {t('agregar_alarma')}</Button>
                </Box>

                {alarms.map((alarm) => (
                    <Card key={alarm.id}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h6">{alarm.name}</Typography>
                                    <Typography color="textSecondary">
                                        {alarm.description}
                                    </Typography>
                                    <Typography variant="body2">
                                        {t('tipo')}{alarm.type} {t('o_condicion')}{alarm.condition} {t('o_umbral')}{alarm.threshold}
                                    </Typography>
                                </Box>
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={alarm.enabled}
                                                onChange={async () => {
                                                    await onEditAlarm({
                                                        ...alarm,
                                                        enabled: !alarm.enabled,
                                                        updatedAt: new Date().toISOString()
                                                    });
                                                }}
                                            />
                                        }
                                        label="Activa"
                                    />
                                    <IconButton
                                        onClick={() => handleOpenDialog(alarm)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(alarm.id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingAlarm ? 'Editar Alarma' : 'Nueva Alarma'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        {submitError && (
                            <Alert severity="error" onClose={() => setSubmitError(null)}>
                                {submitError}
                            </Alert>
                        )}
                        <TextField
                            label="Nombre"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                            fullWidth
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>{t('tipo_1')}</InputLabel>
                            <Select
                                value={formData.type}
                                label="Tipo"
                                onChange={(e) => {
                                    const newType = e.target.value as Alarm['type'];
                                    setFormData({
                                        ...formData,
                                        type: newType,
                                        // Reset threshold when type changes
                                        threshold: newType === 'LTR' ? 0.5 :
                                            newType === 'ROLL_ANGLE' ? 0 :
                                                newType === 'LATERAL_ACCELERATION' ? 0 : 0
                                    });
                                }}
                            >
                                <MenuItem value="LTR">{t('ltr')}</MenuItem>
                                <MenuItem value="ROLL_ANGLE">{t('angulo_de_inclinacion')}</MenuItem>
                                <MenuItem value="LATERAL_ACCELERATION">{t('aceleracion_lateral')}</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>{t('condicion')}</InputLabel>
                            <Select
                                value={formData.condition}
                                label="Condición"
                                onChange={(e) => setFormData({ ...formData, condition: e.target.value as Alarm['condition'] })}
                            >
                                <MenuItem value="greater">{t('mayor_que')}</MenuItem>
                                <MenuItem value="less">{t('menor_que')}</MenuItem>
                                <MenuItem value="equal">{t('igual_a')}</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Umbral"
                            type="number"
                            value={formData.threshold}
                            onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                            error={!!formErrors.threshold}
                            helperText={formErrors.threshold}
                            fullWidth
                            required
                            inputProps={{
                                step: formData.type === 'LTR' ? 0.1 :
                                    formData.type === 'ROLL_ANGLE' ? 1 :
                                        formData.type === 'LATERAL_ACCELERATION' ? 0.1 : 0.1
                            }}
                        />
                        <TextField
                            label="Descripción"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            error={!!formErrors.description}
                            helperText={formErrors.description}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.enabled}
                                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                />
                            }
                            label="Activa"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={isSubmitting}>
                        {t('cancelar')}</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : editingAlarm ? 'Guardar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 