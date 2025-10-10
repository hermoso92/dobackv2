import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Snackbar,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
// import { api } from '../services/api'; // TODO: Implementar cuando el backend esté listo
import { t } from "../i18n";

const CATEGORIES = ['Todos', 'Estabilidad', 'Seguridad', 'Mecánica'];

const KnowledgeBase: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [, setLoading] = useState(false); // Estado necesario para cuando se implemente el backend
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [filter, setFilter] = useState('');

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            // TODO: Implementar endpoint /api/knowledge/documents en el backend
            // const res = await api.get('/api/knowledge/documents');
            // setDocuments(res.data || []);
            setDocuments([]); // Temporalmente vacío hasta implementar backend
        } catch {
            setError('Error al cargar documentos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setError('La funcionalidad de Base de Conocimiento está en desarrollo. Los endpoints del backend serán implementados próximamente.');
        return;

        // TODO: Implementar endpoint /api/knowledge/upload en el backend
        /*
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);
            formData.append('type', selectedCategory);
            await api.post('/api/knowledge/upload', formData);
            setSuccess('Documento subido exitosamente');
            setUploadDialogOpen(false);
            setFile(null);
            fetchDocuments();
        } catch {
            setError('Error al subir documento');
        }
        */
    };

    const handleDelete = async (_id: string) => {
        setError('La funcionalidad de Base de Conocimiento está en desarrollo. Los endpoints del backend serán implementados próximamente.');
        return;

        // TODO: Implementar endpoint /api/knowledge/documents/:id en el backend
        /*
        try {
            await api.delete(`/api/knowledge/documents/${_id}`);
            setSuccess('Documento eliminado');
            fetchDocuments();
        } catch {
            setError('Error al eliminar documento');
        }
        */
    };

    const filteredDocuments = documents.filter(doc =>
        (selectedCategory === 'Todos' || doc.type === selectedCategory) &&
        (!filter || doc.name.toLowerCase().includes(filter.toLowerCase()))
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
                <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
            </Snackbar>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4">
                            {t('base_de_conocimiento_1')}</Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setUploadDialogOpen(true)}
                        >
                            {t('subir_documento')}</Button>
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ mb: 2 }}>
                        <Tabs
                            value={selectedCategory}
                            onChange={(_, newValue) => setSelectedCategory(newValue)}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {CATEGORIES.map((category) => (
                                <Tab key={category} label={category} value={category} />
                            ))}
                        </Tabs>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <TextField
                            label="Buscar documento"
                            size="small"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('nombre_4')}</TableCell>
                                    <TableCell>{t('tipo_9')}</TableCell>
                                    <TableCell>{t('fecha_de_subida')}</TableCell>
                                    <TableCell>{t('acciones_4')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredDocuments.map(doc => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                                        </TableCell>
                                        <TableCell>{doc.type}</TableCell>
                                        <TableCell>{new Date(doc.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <IconButton color="error" onClick={() => handleDelete(doc.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
            <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
                <DialogTitle>{t('subir_nuevo_documento')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="body1" gutterBottom>
                            {t('arrastra_y_suelta_un_archivo_pdf_aqui_o')}</Typography>
                        <Button variant="outlined" component="label">
                            {t('seleccionar_archivo_2')}<input type="file" hidden accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadDialogOpen(false)}>{t('cancelar_10')}</Button>
                    <Button onClick={handleUpload} variant="contained" color="primary" disabled={!file}>
                        {t('subir_1')}</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default KnowledgeBase; 