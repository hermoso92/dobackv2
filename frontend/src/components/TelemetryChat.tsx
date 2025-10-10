import {
    Chat as ChatIcon,
    Close,
    Person,
    Send,
    SmartToy
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Fab,
    IconButton,
    List,
    ListItem,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { FEATURE_FLAGS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTZ } from '../utils/formatDateTZ';
import { logger } from '../utils/logger';

// Tipos para el chat
interface ChatMessage {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    loading?: boolean;
}

interface TelemetryData {
    totalVehicles: number;
    totalMinutesInBase: number;
    totalMinutesOutBase: number;
    totalMinutesInWorkshop: number;
    totalSirenMinutes: number;
    totalSirenActivations: number;
    totalOverspeedCount: number;
    dateFrom: Date;
    dateTo: Date;
}

interface TelemetryChatProps {
    telemetryData?: TelemetryData;
    onClose?: () => void;
}

const TelemetryChat: React.FC<TelemetryChatProps> = ({
    telemetryData,
    onClose
}) => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            type: 'assistant',
            content: '¡Hola! Soy tu asistente de telemetría. Puedo ayudarte con preguntas sobre KPIs, tiempos en base, activaciones de sirena y más. ¿En qué puedo ayudarte?',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Datos mock para el chat
    const mockTelemetryData: TelemetryData = {
        totalVehicles: 12,
        totalMinutesInBase: 1440,
        totalMinutesOutBase: 2880,
        totalMinutesInWorkshop: 240,
        totalSirenMinutes: 180,
        totalSirenActivations: 8,
        totalOverspeedCount: 3,
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dateTo: new Date()
    };

    const data = telemetryData || mockTelemetryData;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        onClose?.();
    };

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const processQuestion = async (question: string): Promise<string> => {
        // Simular procesamiento de IA
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const lowerQuestion = question.toLowerCase();

        // Respuestas basadas en palabras clave
        if (lowerQuestion.includes('vehículo') || lowerQuestion.includes('vehiculo')) {
            return `Tenemos ${data.totalVehicles} vehículos activos en la flota durante esta semana.`;
        }

        if (lowerQuestion.includes('base') && lowerQuestion.includes('tiempo')) {
            return `El tiempo total en base esta semana es de ${formatDuration(data.totalMinutesInBase)}. El tiempo fuera de base es de ${formatDuration(data.totalMinutesOutBase)}.`;
        }

        if (lowerQuestion.includes('taller')) {
            return `Los vehículos han estado ${formatDuration(data.totalMinutesInWorkshop)} en taller durante esta semana.`;
        }

        if (lowerQuestion.includes('sirena') || lowerQuestion.includes('rotativo')) {
            return `Esta semana se han registrado ${data.totalSirenActivations} activaciones de sirena, con un total de ${formatDuration(data.totalSirenMinutes)} minutos de uso.`;
        }

        if (lowerQuestion.includes('velocidad') || lowerQuestion.includes('exceso')) {
            return `Se han detectado ${data.totalOverspeedCount} excesos de velocidad durante esta semana.`;
        }

        if (lowerQuestion.includes('resumen') || lowerQuestion.includes('semana')) {
            return `Resumen de la semana:\n• ${data.totalVehicles} vehículos activos\n• ${formatDuration(data.totalMinutesInBase)} en base\n• ${formatDuration(data.totalMinutesOutBase)} fuera de base\n• ${formatDuration(data.totalMinutesInWorkshop)} en taller\n• ${data.totalSirenActivations} activaciones de sirena\n• ${data.totalOverspeedCount} excesos de velocidad`;
        }

        if (lowerQuestion.includes('ayuda') || lowerQuestion.includes('help')) {
            return `Puedes preguntarme sobre:\n• Número de vehículos\n• Tiempos en base, fuera de base o taller\n• Activaciones de sirena\n• Excesos de velocidad\n• Resumen semanal\n\nSolo escribe tu pregunta en lenguaje natural.`;
        }

        // Respuesta genérica
        const genericResponses = [
            'Interesante pregunta. Basándome en los datos de telemetría de esta semana, puedo ayudarte a analizar el rendimiento de la flota.',
            'Los datos muestran actividad significativa esta semana. ¿Te gustaría que profundice en algún aspecto específico?',
            'Puedo analizar los KPIs de telemetría para darte una respuesta más precisa. ¿Podrías reformular tu pregunta?',
            'Basándome en los datos disponibles, puedo ayudarte con información sobre tiempos, activaciones y eventos de la flota.'
        ];

        return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await processQuestion(inputValue.trim());

            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            logger.error('Error procesando pregunta del chat:', error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                type: 'assistant',
                content: 'Lo siento, ha ocurrido un error procesando tu pregunta. Por favor, inténtalo de nuevo.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const quickQuestions = [
        '¿Cuántos vehículos tenemos?',
        '¿Cuánto tiempo estuvieron en base?',
        '¿Cuántas activaciones de sirena hubo?',
        'Resumen de la semana'
    ];

    const handleQuickQuestion = (question: string) => {
        setInputValue(question);
    };

    if (!FEATURE_FLAGS.SIDECHAT_AI) {
        return null;
    }

    return (
        <>
            {/* Botón flotante para abrir el chat */}
            <Fab
                color="primary"
                aria-label="chat"
                onClick={handleOpen}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000
                }}
            >
                <ChatIcon />
            </Fab>

            {/* Dialog del chat */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        height: '80vh',
                        maxHeight: '600px',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <SmartToy color="primary" />
                            <Typography variant="h6">
                                Asistente de Telemetría
                            </Typography>
                        </Stack>
                        <IconButton onClick={handleClose} size="small">
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column' }}>
                    {/* Preguntas rápidas */}
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                            Preguntas frecuentes:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {quickQuestions.map((question, index) => (
                                <Chip
                                    key={index}
                                    label={question}
                                    size="small"
                                    onClick={() => handleQuickQuestion(question)}
                                    variant="outlined"
                                    sx={{ mb: 1 }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    {/* Mensajes */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        <List sx={{ p: 0 }}>
                            {messages.map((message) => (
                                <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', px: 0 }}>
                                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                                        <Avatar sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main'
                                        }}>
                                            {message.type === 'user' ? <Person /> : <SmartToy />}
                                        </Avatar>
                                        <Paper
                                            sx={{
                                                p: 1.5,
                                                maxWidth: '80%',
                                                bgcolor: message.type === 'user'
                                                    ? 'primary.light'
                                                    : 'grey.100',
                                                color: message.type === 'user'
                                                    ? 'primary.contrastText'
                                                    : 'text.primary'
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {message.content}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: 'block',
                                                    mt: 0.5,
                                                    opacity: 0.7
                                                }}
                                            >
                                                {formatDateTZ(message.timestamp.toISOString(), user?.timezone || 'UTC', { preset: 'time' })}
                                            </Typography>
                                        </Paper>
                                    </Stack>
                                </ListItem>
                            ))}
                            {isLoading && (
                                <ListItem sx={{ px: 0 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                            <SmartToy />
                                        </Avatar>
                                        <CircularProgress size={16} />
                                        <Typography variant="caption" color="text.secondary">
                                            Pensando...
                                        </Typography>
                                    </Stack>
                                </ListItem>
                            )}
                            <div ref={messagesEndRef} />
                        </List>
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                fullWidth
                                placeholder="Pregunta sobre telemetría..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading}
                                size="small"
                                multiline
                                maxRows={3}
                            />
                            <Button
                                variant="contained"
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isLoading}
                                sx={{ minWidth: 'auto', px: 2 }}
                            >
                                <Send />
                            </Button>
                        </Stack>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TelemetryChat;
