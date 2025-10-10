import {
    Analytics,
    Assessment,
    AutoAwesome,
    BugReport,
    Chat,
    CheckCircle,
    Insights,
    Lightbulb,
    Psychology,
    Recommend,
    Refresh,
    Security,
    Send,
    Settings,
    Speed,
    Speed as SpeedIcon,
    Timeline,
    TrendingUp,
    Warning
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
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { OptimizedAIAnalysis } from '../components/ai/OptimizedAIAnalysis';
import { RealAIExplanation } from '../components/ai/RealAIExplanation';
import ErrorBoundary from '../components/ErrorBoundary';
import { AI_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { AIChatMessage, AIExplanationDTO } from '../types/ai';
import { logger } from '../utils/logger';

// Componentes styled
const MainContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: theme.palette.background.default,
    overflow: 'auto',
    padding: theme.spacing(2)
}));

const HeaderSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    width: '100%',
    marginBottom: theme.spacing(2)
}));

const MetricsGrid = styled(Grid)(({ theme }) => ({
    marginBottom: theme.spacing(2)
}));

const MetricCard = styled(Card)(({ theme }) => ({
    height: '100%',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4]
    }
}));

const ChatContainer = styled(Paper)(({ theme }) => ({
    height: '400px',
    overflow: 'auto',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default
}));

interface AIMetrics {
    totalExplanations: number;
    totalSuggestions: number;
    activeChats: number;
    confidenceScore: number;
    patternsDetected: number;
    recommendationsGenerated: number;
    issuesResolved: number;
    performanceImprovement: number;
}

interface AIModule {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    status: 'active' | 'inactive' | 'error';
    lastUpdate: string;
    metrics: {
        explanations: number;
        suggestions: number;
        confidence: number;
    };
}

const UnifiedAI: React.FC = () => {
    const navigate = useNavigate();
    const { t: _translate } = useTranslation();
    const { isAuthenticated } = useAuth();

    // Estados principales
    const [currentTab, setCurrentTab] = useState(0);
    const [selectedModule, setSelectedModule] = useState<string>('general');
    const [chatMessage, setChatMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados de IA
    const [explanations, setExplanations] = useState<AIExplanationDTO[]>([]);
    const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
    const [, setSuggestions] = useState<any[]>([]);
    const [, setPatterns] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [, setExplainingSuggestion] = useState<string | null>(null);
    const [suggestionExplanation, setSuggestionExplanation] = useState<any>(null);
    const [showExplanationModal, setShowExplanationModal] = useState(false);

    // Métricas de IA
    const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
        totalExplanations: 0,
        totalSuggestions: 0,
        activeChats: 0,
        confidenceScore: 0,
        patternsDetected: 0,
        recommendationsGenerated: 0,
        issuesResolved: 0,
        performanceImprovement: 0
    });

    // Módulos de IA
    const [aiModules] = useState<AIModule[]>([
        {
            id: 'general',
            name: 'General',
            icon: <Psychology />,
            description: 'Análisis general del sistema',
            status: 'active',
            lastUpdate: new Date().toISOString(),
            metrics: { explanations: 15, suggestions: 8, confidence: 92 }
        },
        {
            id: 'stability',
            name: 'Estabilidad',
            icon: <Speed />,
            description: 'Análisis de estabilidad vehicular',
            status: 'active',
            lastUpdate: new Date().toISOString(),
            metrics: { explanations: 12, suggestions: 5, confidence: 88 }
        },
        {
            id: 'telemetry',
            name: 'Telemetría',
            icon: <Timeline />,
            description: 'Análisis de datos CAN/GPS',
            status: 'active',
            lastUpdate: new Date().toISOString(),
            metrics: { explanations: 20, suggestions: 12, confidence: 95 }
        },
        {
            id: 'emergency',
            name: 'Emergencias',
            icon: <Warning />,
            description: 'Análisis de situaciones de emergencia',
            status: 'active',
            lastUpdate: new Date().toISOString(),
            metrics: { explanations: 8, suggestions: 3, confidence: 90 }
        },
        {
            id: 'performance',
            name: 'Rendimiento',
            icon: <Analytics />,
            description: 'Análisis de rendimiento operativo',
            status: 'active',
            lastUpdate: new Date().toISOString(),
            metrics: { explanations: 18, suggestions: 10, confidence: 87 }
        }
    ]);

    // Datos mock comentados para desarrollo

    // Datos mock comentados para desarrollo
    // const mockChatMessages: AIChatMessage[] = [...];

    // Efectos
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        loadAIData();
    }, []);

    useEffect(() => {
        // Simular actualización de métricas
        const interval = setInterval(() => {
            setAiMetrics(prev => ({
                ...prev,
                confidenceScore: Math.min(100, prev.confidenceScore + Math.random() * 2 - 1),
                patternsDetected: prev.patternsDetected + Math.floor(Math.random() * 3),
                recommendationsGenerated: prev.recommendationsGenerated + Math.floor(Math.random() * 2)
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Funciones
    const loadAIData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Cargar datos reales desde la API
            const [explanationsRes, statsRes, patternsRes] = await Promise.all([
                fetch(`${AI_ENDPOINTS.EXPLANATIONS}?days=30`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }),
                fetch(AI_ENDPOINTS.STATS, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }),
                fetch(`${AI_ENDPOINTS.PATTERNS}?days=30`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            ]);

            // Intentar cargar recomendaciones de vehículos (opcional, puede no existir)
            let vehicleRecommendationsData = { success: false, data: [] };
            try {
                const vehicleRecommendationsRes = await fetch(AI_ENDPOINTS.SUGGESTIONS_VEHICLES, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (vehicleRecommendationsRes.ok) {
                    vehicleRecommendationsData = await vehicleRecommendationsRes.json();
                }
            } catch (e) {
                // Endpoint no disponible, continuar sin recomendaciones de vehículos
                logger.debug('Endpoint de recomendaciones de vehículos no disponible');
            }

            const explanationsData = await explanationsRes.json();
            const statsData = await statsRes.json();
            const patternsData = await patternsRes.json();

            if (explanationsData.success) {
                setExplanations(explanationsData.data || []);

                // Establecer métricas desde datos reales
                if (statsData.success && statsData.data) {
                    setAiMetrics({
                        totalExplanations: statsData.data.totalSessions || 0,
                        totalSuggestions: statsData.data.recommendationsGenerated || 0,
                        activeChats: 1,
                        confidenceScore: statsData.data.averageConfidence || 90,
                        patternsDetected: statsData.data.patternsDetected || 0,
                        recommendationsGenerated: statsData.data.recommendationsGenerated || 0,
                        issuesResolved: 0,
                        performanceImprovement: 0
                    });
                }

                if (patternsData.success) {
                    setPatterns(patternsData.data || []);
                }

                // Extraer sugerencias de las explicaciones y agregar recomendaciones específicas de vehículos
                const explanationSuggestions = explanationsData.data?.flatMap((exp: any) => exp.suggestions || []) || [];
                const vehicleSuggestions = vehicleRecommendationsData.success ? (vehicleRecommendationsData.data || []) : [];
                const allSuggestions = [...explanationSuggestions, ...vehicleSuggestions];
                setSuggestions(allSuggestions);
            }

        } catch (error) {
            logger.error('Error cargando datos de IA:', error);
            setError('Error al cargar los datos de IA');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleModuleChange = (moduleId: string) => {
        setSelectedModule(moduleId);
        logger.info('Módulo de IA cambiado', { moduleId });
    };

    const handleSendMessage = useCallback(async () => {
        if (!chatMessage.trim()) return;

        const userMessage: AIChatMessage = {
            id: `msg-${Date.now()}`,
            sessionId: 'session-1',
            role: 'user',
            content: chatMessage,
            timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, userMessage]);
        const currentMessage = chatMessage;
        setChatMessage('');
        setIsAnalyzing(true);

        try {
            // Enviar mensaje real a la API
            const response = await fetch(AI_ENDPOINTS.CHAT_MESSAGES('session-1'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    content: currentMessage,
                    context: { module: selectedModule }
                })
            });

            const data = await response.json();

            if (data.success && data.data) {
                setChatMessages(prev => [...prev, data.data]);

                // Si hay sugerencias en la respuesta, agregarlas
                if (data.data.metadata?.suggestions?.length > 0) {
                    setSuggestions(prev => [...prev, ...data.data.metadata.suggestions]);
                }
            } else {
                throw new Error(data.error || 'Error al procesar el mensaje');
            }
        } catch (error) {
            logger.error('Error enviando mensaje:', error);
            setError('Error al procesar el mensaje');

            // Mensaje de error para el usuario
            const errorMessage: AIChatMessage = {
                id: `msg-${Date.now() + 1}`,
                sessionId: 'session-1',
                role: 'assistant',
                content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
                timestamp: new Date().toISOString()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAnalyzing(false);
        }
    }, [chatMessage, selectedModule]);

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleExplainSuggestion = useCallback(async (suggestionId: string) => {
        try {
            setExplainingSuggestion(suggestionId);
            setError(null);

            const response = await fetch(AI_ENDPOINTS.SUGGESTION_EXPLAIN(suggestionId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    context: { module: selectedModule }
                })
            });

            const data = await response.json();

            if (data.success && data.data) {
                setSuggestionExplanation(data.data);
                setShowExplanationModal(true);
            } else {
                throw new Error(data.error || 'Error al obtener la explicación');
            }
        } catch (error) {
            logger.error('Error obteniendo explicación de sugerencia:', error);
            setError('Error al obtener la explicación de la sugerencia');
        } finally {
            setExplainingSuggestion(null);
        }
    }, [selectedModule]);

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'panel':
                return <Assessment />;
            case 'telemetry':
                return <Timeline />;
            case 'stability':
                return <Speed />;
            case 'emergency':
                return <Warning />;
            case 'performance':
                return <Analytics />;
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'default';
            case 'error':
                return 'error';
            default:
                return 'default';
        }
    };

    // Renderizado condicional
    if (!isAuthenticated) {
        return null;
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando IA...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Alert severity="error" sx={{ maxWidth: 600 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <ErrorBoundary>
            <MainContainer>
                {/* Header */}
                <HeaderSection>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <AutoAwesome color="primary" />
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                Inteligencia Artificial Avanzada
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                Análisis inteligente, explicaciones automáticas y asistente conversacional
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                            label={`Confianza: ${aiMetrics.confidenceScore.toFixed(1)}%`}
                            color={getConfidenceColor(aiMetrics.confidenceScore) as any}
                            icon={<TrendingUp />}
                        />
                        <Tooltip title="Configuración">
                            <IconButton>
                                <Settings />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refrescar">
                            <IconButton onClick={loadAIData}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </HeaderSection>

                {/* Métricas principales */}
                <MetricsGrid container spacing={3} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <MetricCard>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Sugerencias Activas
                                </Typography>
                                <Typography variant="h4" color="secondary">
                                    {aiMetrics.totalSuggestions}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {aiMetrics.recommendationsGenerated} recomendaciones
                                </Typography>
                            </CardContent>
                        </MetricCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <MetricCard>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Chats Activos
                                </Typography>
                                <Typography variant="h4" color="info.main">
                                    {aiMetrics.activeChats}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {aiMetrics.issuesResolved} problemas resueltos
                                </Typography>
                            </CardContent>
                        </MetricCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <MetricCard>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Mejora de Rendimiento
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    +{aiMetrics.performanceImprovement}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Optimización general
                                </Typography>
                            </CardContent>
                        </MetricCard>
                    </Grid>
                </MetricsGrid>

                {/* Módulos de IA */}
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Módulos de IA Disponibles
                        </Typography>
                        <Grid container spacing={2}>
                            {aiModules.map((module) => (
                                <Grid item xs={12} sm={6} md={4} key={module.id}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            border: selectedModule === module.id ? 2 : 1,
                                            borderColor: selectedModule === module.id ? 'primary.main' : 'divider',
                                            '&:hover': { borderColor: 'primary.main' }
                                        }}
                                        onClick={() => handleModuleChange(module.id)}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                {module.icon}
                                                <Typography variant="h6">
                                                    {module.name}
                                                </Typography>
                                                <Chip
                                                    label={module.status}
                                                    size="small"
                                                    color={getStatusColor(module.status) as any}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {module.description}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Chip
                                                    label={`${module.metrics.explanations} explicaciones`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={`${module.metrics.confidence}% confianza`}
                                                    size="small"
                                                    color={getConfidenceColor(module.metrics.confidence) as any}
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>

                {/* Pestañas principales */}
                <Card sx={{ flex: 1 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={currentTab} onChange={handleTabChange} aria-label="ai tabs">
                            <Tab
                                icon={<Insights />}
                                label="Explicaciones"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Chat />}
                                label="Chat con IA"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Recommend />}
                                label="Sugerencias"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Analytics />}
                                label="Análisis Avanzado"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<BugReport />}
                                label="Diagnóstico"
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    {/* Contenido de pestañas */}
                    {currentTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            {/* Análisis IA Optimizado */}
                            <Box sx={{ mb: 3 }}>
                                <OptimizedAIAnalysis
                                    timeWindow="24h"
                                    autoRefresh={true}
                                    refreshInterval={30000}
                                />
                            </Box>

                            {/* Explicaciones Reales de IA */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Análisis Inteligente en Tiempo Real
                                </Typography>
                                <RealAIExplanation
                                    module={selectedModule}
                                    context={`Análisis de ${aiModules.find(m => m.id === selectedModule)?.name || 'Sistema'}`}
                                    analysisType="comprehensive"
                                    depth="medium"
                                    language="es"
                                    onExplanationGenerated={(explanation) => {
                                        logger.info('Explicación de IA generada', {
                                            explanationId: explanation.explanation?.id,
                                            confidence: explanation.explanation?.confidence
                                        });
                                    }}
                                />
                            </Box>

                            <Typography variant="h6" gutterBottom>
                                Explicaciones Automáticas - {aiModules.find(m => m.id === selectedModule)?.name}
                            </Typography>

                            <Grid container spacing={3}>
                                {explanations.filter(exp => exp.module === selectedModule || selectedModule === 'general').map((explanation) => (
                                    <Grid item xs={12} md={6} key={explanation.id}>
                                        <Card sx={{ height: '100%' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        {getModuleIcon(explanation.module)}
                                                        <Typography variant="h6">
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

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {explanation.explanation}
                                                </Typography>

                                                {explanation.suggestions.length > 0 && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Sugerencias:
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                                            {explanation.suggestions.map((suggestion) => (
                                                                <Chip
                                                                    key={suggestion.id}
                                                                    label={suggestion.title}
                                                                    size="small"
                                                                    color={getPriorityColor(suggestion.priority) as any}
                                                                    variant="outlined"
                                                                    sx={{ mb: 1 }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                )}

                                                <Box sx={{ mt: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
                                                    {new Date(explanation.createdAt).toLocaleString()}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {currentTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Chat con IA - {aiModules.find(m => m.id === selectedModule)?.name}
                            </Typography>

                            <ChatContainer>
                                {chatMessages.map((message) => (
                                    <Box key={message.id} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '70%' }}>
                                                <Avatar sx={{ width: 32, height: 32 }}>
                                                    {message.role === 'user' ? 'U' : 'AI'}
                                                </Avatar>
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        backgroundColor: message.role === 'user' ? 'primary.main' : 'grey.100',
                                                        color: message.role === 'user' ? 'white' : 'text.primary'
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        {message.content}
                                                    </Typography>
                                                    {message.metadata?.suggestions && (
                                                        <Box sx={{ mt: 1 }}>
                                                            {message.metadata.suggestions.map((suggestion) => (
                                                                <Chip
                                                                    key={suggestion.id}
                                                                    label={suggestion.title}
                                                                    size="small"
                                                                    color={getPriorityColor(suggestion.priority) as any}
                                                                    variant="outlined"
                                                                    sx={{ mr: 1, mb: 1 }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Paper>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}

                                {isAnalyzing && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Avatar sx={{ width: 32, height: 32 }}>AI</Avatar>
                                        <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={16} />
                                                <Typography variant="body2">Analizando...</Typography>
                                            </Box>
                                        </Paper>
                                    </Box>
                                )}
                            </ChatContainer>

                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
                                    disabled={!chatMessage.trim() || isAnalyzing}
                                    startIcon={<Send />}
                                >
                                    Enviar
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {currentTab === 2 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Sugerencias Automáticas
                            </Typography>

                            <Grid container spacing={3}>
                                {explanations.flatMap(exp => exp.suggestions).map((suggestion, index) => (
                                    <Grid item xs={12} md={6} key={index}>
                                        <Card>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                    <Box>
                                                        <Typography variant="h6">
                                                            {suggestion.title}
                                                        </Typography>
                                                        {suggestion.vehicleSpecific && suggestion.vehicleName && (
                                                            <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                                                                🚗 {suggestion.vehicleName}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Chip
                                                        label={suggestion.priority}
                                                        size="small"
                                                        color={getPriorityColor(suggestion.priority) as any}
                                                    />
                                                </Box>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {suggestion.description}
                                                </Typography>

                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Impacto Estimado:
                                                    </Typography>
                                                    {suggestion.estimatedImpact?.map((impact, idx) => (
                                                        <Typography key={idx} variant="body2">
                                                            {impact.metric}: {impact.change > 0 ? '+' : ''}{impact.change}%
                                                        </Typography>
                                                    ))}
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                                    <Chip
                                                        label={`${suggestion.confidence}% confianza`}
                                                        size="small"
                                                        color={getConfidenceColor(suggestion.confidence) as any}
                                                        variant="outlined"
                                                    />
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleExplainSuggestion(suggestion.id)}
                                                        >
                                                            Explicar
                                                        </Button>
                                                        {suggestion.actionable && (
                                                            <Button size="small" variant="contained">
                                                                Implementar
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {currentTab === 3 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Análisis Avanzado
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Patrones Detectados
                                            </Typography>
                                            <List>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <TrendingUp color="success" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Mejora en eficiencia de rutas"
                                                        secondary="15% de mejora en los últimos 7 días"
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <Warning color="warning" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Aumento de eventos críticos"
                                                        secondary="En vehículos de más de 5 años"
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <CheckCircle color="info" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Optimización de combustible"
                                                        secondary="8% de reducción en consumo"
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Recomendaciones Prioritarias
                                            </Typography>
                                            <List>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <Lightbulb color="warning" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Implementar geocercas en zona urbana"
                                                        secondary="Alta prioridad - Reduciría excesos de velocidad en 25%"
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <Security color="error" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Revisar sistema de frenos"
                                                        secondary="Media prioridad - Mejoraría estabilidad en 15%"
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <SpeedIcon color="info" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Optimizar rutas de emergencia"
                                                        secondary="Baja prioridad - Reduciría tiempos de respuesta en 10%"
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {currentTab === 4 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Diagnóstico del Sistema
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Estado de Módulos
                                            </Typography>
                                            {aiModules.map((module) => (
                                                <Box key={module.id} sx={{ mb: 2 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="body1">
                                                            {module.name}
                                                        </Typography>
                                                        <Chip
                                                            label={module.status}
                                                            size="small"
                                                            color={getStatusColor(module.status) as any}
                                                        />
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={module.metrics.confidence}
                                                        sx={{ mb: 1 }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Última actualización: {new Date(module.lastUpdate).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Métricas de Rendimiento
                                            </Typography>
                                            <Stack spacing={2}>
                                                <Box>
                                                    <Typography variant="body2" gutterBottom>
                                                        Tiempo de respuesta promedio
                                                    </Typography>
                                                    <LinearProgress variant="determinate" value={75} />
                                                    <Typography variant="caption">1.2s</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" gutterBottom>
                                                        Precisión de análisis
                                                    </Typography>
                                                    <LinearProgress variant="determinate" value={89} color="success" />
                                                    <Typography variant="caption">89%</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" gutterBottom>
                                                        Uso de recursos
                                                    </Typography>
                                                    <LinearProgress variant="determinate" value={45} color="warning" />
                                                    <Typography variant="caption">45%</Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Card>

                {/* Modal de explicación de sugerencia */}
                {showExplanationModal && suggestionExplanation && (
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1300,
                            p: 2
                        }}
                        onClick={() => setShowExplanationModal(false)}
                    >
                        <Card
                            sx={{
                                maxWidth: 800,
                                width: '100%',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                backgroundColor: 'background.paper'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        Explicación Detallada de Sugerencia
                                    </Typography>
                                    <IconButton onClick={() => setShowExplanationModal(false)}>
                                        ×
                                    </IconButton>
                                </Box>

                                <Typography
                                    variant="body1"
                                    sx={{
                                        mb: 3,
                                        whiteSpace: 'pre-line',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {suggestionExplanation.explanation}
                                </Typography>

                                {suggestionExplanation.detailedSteps && suggestionExplanation.detailedSteps.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Pasos Detallados:
                                        </Typography>
                                        <List>
                                            {suggestionExplanation.detailedSteps.map((step: string, index: number) => (
                                                <ListItem key={index} sx={{ py: 0.5 }}>
                                                    <ListItemIcon>
                                                        <Typography variant="body2" color="primary">
                                                            {index + 1}.
                                                        </Typography>
                                                    </ListItemIcon>
                                                    <ListItemText primary={step} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}

                                {suggestionExplanation.expectedResults && suggestionExplanation.expectedResults.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Resultados Esperados:
                                        </Typography>
                                        {suggestionExplanation.expectedResults.map((result: any, index: number) => (
                                            <Box key={index} sx={{ mb: 1 }}>
                                                <Typography variant="body2">
                                                    <strong>{result.metric}:</strong> {result.current} → {result.expected}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Tiempo de implementación: {suggestionExplanation.implementationTime}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Criterios de éxito: {suggestionExplanation.successCriteria}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        onClick={() => setShowExplanationModal(false)}
                                    >
                                        Cerrar
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </MainContainer>
        </ErrorBoundary>
    );
};

export default UnifiedAI;
