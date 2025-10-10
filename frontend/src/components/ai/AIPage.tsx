import {
    Assessment,
    CloudUpload,
    Psychology,
    Refresh,
    Send,
    Settings,
    Speed,
    Timeline
} from '@mui/icons-material';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { AIChatMessage, AIExplanationDTO } from '../../types/ai';
import { logger } from '../../utils/logger';

interface AIPageProps {
    initialModule?: string;
}

export const AIPage: React.FC<AIPageProps> = ({
    initialModule
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedModule, setSelectedModule] = useState(initialModule || 'panel');
    const [chatMessage, setChatMessage] = useState('');
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    // Mock data para desarrollo
    const mockExplanations: AIExplanationDTO[] = [
        {
            id: 'expl-1',
            orgId: 'org-1',
            module: 'panel',
            context: 'KPI Analysis',
            data: { kpiId: 'kpi-1', value: 85, trend: 'up' },
            explanation: 'Los KPIs muestran una mejora del 15% en la eficiencia operativa. Esta tendencia positiva se debe principalmente a la optimización de rutas y la reducción de tiempos de inactividad.',
            confidence: 92,
            references: [
                {
                    type: 'kpi',
                    id: 'kpi-1',
                    name: 'Eficiencia Operativa',
                    value: 85,
                    description: 'Métrica principal de rendimiento'
                }
            ],
            suggestions: [
                {
                    id: 'sugg-1',
                    type: 'optimization',
                    title: 'Optimizar rutas de vehículos',
                    description: 'Implementar algoritmo de optimización de rutas para reducir tiempos de viaje',
                    priority: 'medium',
                    actionable: true,
                    actionUrl: '/telemetria-v2',
                    confidence: 88,
                    reasoning: ['Reducción de 12% en tiempos de viaje', 'Ahorro de combustible estimado'],
                    estimatedImpact: [
                        { metric: 'Tiempo de viaje', change: -12, direction: 'decrease' },
                        { metric: 'Consumo de combustible', change: -8, direction: 'decrease' }
                    ]
                }
            ],
            createdAt: '2024-01-15T10:00:00Z',
            expiresAt: '2024-01-22T10:00:00Z',
            metadata: {
                model: 'gpt-4',
                version: '1.0.0',
                processingTime: 1250,
                tokensUsed: 450,
                contextSize: 1024,
                dataPoints: 150,
                analysisDepth: 'medium',
                language: 'es'
            }
        }
    ];

    const mockChatMessages: AIChatMessage[] = [
        {
            id: 'msg-1',
            sessionId: 'session-1',
            role: 'user',
            content: '¿Puedes explicarme por qué han subido los excesos de velocidad esta semana?',
            timestamp: '2024-01-15T10:00:00Z'
        },
        {
            id: 'msg-2',
            sessionId: 'session-1',
            role: 'assistant',
            content: 'Los excesos de velocidad han aumentado un 18% esta semana, principalmente concentrados en la zona urbana. Esto se debe a: 1) Cambios en el tráfico por obras, 2) Nuevos conductores en la flota, 3) Rutas más largas por desvíos. Te recomiendo revisar las alertas de velocidad y considerar geocercas en zonas críticas.',
            timestamp: '2024-01-15T10:01:00Z',
            metadata: {
                module: 'telemetry',
                references: [
                    {
                        type: 'event',
                        id: 'event-1',
                        name: 'Exceso de velocidad',
                        description: 'Evento crítico detectado'
                    }
                ],
                suggestions: [
                    {
                        id: 'sugg-2',
                        type: 'geofence',
                        title: 'Crear geocerca en zona urbana',
                        description: 'Establecer límites de velocidad en áreas críticas',
                        priority: 'high',
                        actionable: true,
                        confidence: 85,
                        reasoning: ['Reducción de excesos en 25%', 'Mejora de seguridad'],
                        estimatedImpact: [
                            { metric: 'Excesos de velocidad', change: -25, direction: 'decrease' }
                        ]
                    }
                ]
            }
        }
    ];

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleModuleChange = (module: string) => {
        setSelectedModule(module);
        logger.info('Módulo de IA cambiado', { module });
    };

    const handleSendMessage = () => {
        if (chatMessage.trim()) {
            logger.info('Enviando mensaje de chat', { message: chatMessage });
            // TODO: Implementar envío de mensaje
            setChatMessage('');
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'panel':
                return <Assessment />;
            case 'telemetry':
                return <Timeline />;
            case 'stability':
                return <Speed />;
            case 'reports':
                return <Assessment />;
            case 'uploads':
                return <CloudUpload />;
            default:
                return <Psychology />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'success';
            case 'medium':
                return 'warning';
            case 'high':
                return 'error';
            case 'critical':
                return 'error';
            default:
                return 'default';
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 90) return 'success';
        if (confidence >= 70) return 'warning';
        return 'error';
    };

    if (isLoading) {
        return (
            <Box className="h-full flex items-center justify-center">
                <CircularProgress />
                <Typography className="ml-2">Cargando IA...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="h-full p-4">
                <Alert severity="error">
                    Error cargando IA: {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box className="h-full flex flex-col">
            {/* Header */}
            <Box className="mb-4">
                <Box className="flex items-center justify-between mb-2">
                    <Box className="flex items-center gap-2">
                        <Psychology />
                        <Typography variant="h4" className="font-bold">
                            Inteligencia Artificial
                        </Typography>
                    </Box>

                    <Box className="flex items-center gap-2">
                        <Tooltip title="Configuración">
                            <IconButton>
                                <Settings />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Refrescar">
                            <IconButton>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Typography variant="body1" className="text-gray-600">
                    Análisis inteligente, explicaciones automáticas y asistente conversacional
                </Typography>
            </Box>

            {/* Tabs */}
            <Card className="flex-1 flex flex-col">
                <Box className="border-b border-gray-200">
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        className="min-h-0"
                    >
                        <Tab label="Explicaciones" />
                        <Tab label="Chat" />
                        <Tab label="Sugerencias" />
                        <Tab label="Análisis" />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                <CardContent className="flex-1 p-4">
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Explicaciones Automáticas
                            </Typography>

                            <Grid container spacing={3}>
                                {mockExplanations.map((explanation) => (
                                    <Grid item xs={12} md={6} key={explanation.id}>
                                        <Card className="h-full">
                                            <CardContent>
                                                <Box className="flex items-center justify-between mb-2">
                                                    <Box className="flex items-center gap-2">
                                                        {getModuleIcon(explanation.module)}
                                                        <Typography variant="h6" className="font-bold">
                                                            {explanation.context}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={`${explanation.confidence}%`}
                                                        size="small"
                                                        color={getConfidenceColor(explanation.confidence) as any}
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Typography variant="body2" className="text-gray-600 mb-3">
                                                    {explanation.explanation}
                                                </Typography>

                                                {explanation.suggestions.length > 0 && (
                                                    <Box className="mt-3">
                                                        <Typography variant="subtitle2" className="mb-2">
                                                            Sugerencias:
                                                        </Typography>
                                                        {explanation.suggestions.map((suggestion) => (
                                                            <Chip
                                                                key={suggestion.id}
                                                                label={suggestion.title}
                                                                size="small"
                                                                color={getPriorityColor(suggestion.priority) as any}
                                                                variant="outlined"
                                                                className="mr-1 mb-1"
                                                            />
                                                        ))}
                                                    </Box>
                                                )}

                                                <Box className="mt-3 text-xs text-gray-500">
                                                    {new Date(explanation.createdAt).toLocaleString()}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box className="h-full flex flex-col">
                            <Typography variant="h6" className="mb-4">
                                Chat con IA
                            </Typography>

                            <Box className="flex-1 flex flex-col">
                                {/* Chat Messages */}
                                <Paper className="flex-1 p-4 mb-4 overflow-y-auto">
                                    {mockChatMessages.map((message) => (
                                        <Box key={message.id} className="mb-4">
                                            <Box className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <Box className={`flex items-start gap-2 max-w-xs ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <Avatar className="w-8 h-8">
                                                        {message.role === 'user' ? 'U' : 'AI'}
                                                    </Avatar>
                                                    <Box className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                                                        <Typography variant="body2">
                                                            {message.content}
                                                        </Typography>
                                                        {message.metadata?.suggestions && (
                                                            <Box className="mt-2">
                                                                {message.metadata.suggestions.map((suggestion) => (
                                                                    <Chip
                                                                        key={suggestion.id}
                                                                        label={suggestion.title}
                                                                        size="small"
                                                                        color={getPriorityColor(suggestion.priority) as any}
                                                                        variant="outlined"
                                                                        className="mr-1 mb-1"
                                                                    />
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Paper>

                                {/* Chat Input */}
                                <Box className="flex gap-2">
                                    <TextField
                                        fullWidth
                                        multiline
                                        maxRows={3}
                                        placeholder="Pregunta algo a la IA..."
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        size="small"
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleSendMessage}
                                        disabled={!chatMessage.trim()}
                                        startIcon={<Send />}
                                    >
                                        Enviar
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Sugerencias Automáticas
                            </Typography>
                            <Alert severity="info">
                                Vista de sugerencias en desarrollo...
                            </Alert>
                        </Box>
                    )}

                    {activeTab === 3 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Análisis Avanzado
                            </Typography>
                            <Alert severity="info">
                                Vista de análisis en desarrollo...
                            </Alert>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};
