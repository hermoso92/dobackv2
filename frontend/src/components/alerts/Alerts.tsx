import {
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { t } from "../../i18n";

const Alerts = () => {
    // Datos de ejemplo
    const alerts = [
        {
            id: 1,
            type: 'Inclinación',
            message: 'Inclinación excesiva detectada',
            vehicle: 'DOBACK003',
            timestamp: '2024-03-05 09:30:00',
            status: 'Activo',
        },
        {
            id: 2,
            type: 'Velocidad',
            message: 'Velocidad excesiva detectada',
            vehicle: 'DOBACK002',
            timestamp: '2024-03-05 09:25:00',
            status: 'Resuelto',
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                {t('alertas_4')}</Typography>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('tipo_20')}</TableCell>
                                <TableCell>{t('mensaje')}</TableCell>
                                <TableCell>{t('vehiculo_22')}</TableCell>
                                <TableCell>{t('fechahora')}</TableCell>
                                <TableCell>{t('estado_18')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {alerts.map((alert) => (
                                <TableRow key={alert.id}>
                                    <TableCell>{alert.type}</TableCell>
                                    <TableCell>{alert.message}</TableCell>
                                    <TableCell>{alert.vehicle}</TableCell>
                                    <TableCell>{alert.timestamp}</TableCell>
                                    <TableCell>{alert.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default Alerts; 