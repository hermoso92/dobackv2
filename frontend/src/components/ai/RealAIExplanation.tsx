import {
    Analytics,
    CheckCircle,
    Error,
    Info,
    Psychology,
    TrendingUp,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface AIExplanation {
    id: string;
    orgId: string;
    module: string;
    context: string;
    explanation: string;
    confidence: number;
    references: string[];
    suggestions: string[];
    createdAt: string;
    expiresAt: string;
    metadata: {
        model: string;
        version: string;
        processingTime: number;
        tokensUsed: number;
        contextSize: number;
        dataPoints: number;
        analysisDepth: string;
        language: string;
    };
}

interface AIInsight {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    data?: any;
}

interface AIRecommendation {
    id: string;
    type: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionable: boolean;
    confidence: number;
    reasoning: string[];
    estimatedImpact: Array<{
        metric: string;
        change: number;
        direction: 'increase' | 'decrease';
    }>;
    steps: string[];
}

interface RiskAssessment {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigationStrategies: string[];
}

interface RealAIExplanationProps {
    module: string;
    context: string;
    analysisType?: string;
    depth?: string;
    language?: string;
    onExplanationGenerated?: (explanation: any) => void;
}

export const RealAIExplanation: React.FC<RealAIExplanationProps> = ({
    module,
    context,
    analysisType = 'comprehensive',
    depth = 'medium',
    language = 'es',
    onExplanationGenerated
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [explanation, setExplanation] = useState<AIExplanation | null>(null);
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
    const [statistics, setStatistics] = useState<any>(null);

    const generateExplanation = useCallback(async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        setError(null);

        try {
            logger.info('Generando explicación real de IA', { module, context, analysisType, depth });

            const response = await apiService.post('/api/ai/explanation/contextual', {
                module,
                context,
                analysisType,
                depth,
                language
            });

            if (response.success && response.data) {
                const data = response.data as any;

                setExplanation(data.explanation);
                setInsights(data.insights || []);
                setRecommendations(data.recommendations || []);
                setRiskAssessment(data.riskAssessment || null);
                setStatistics(data.statistics || null);

                onExplanationGenerated?.(data);

                logger.info('Explicación de IA generada exitosamente', {
                    explanationId: data.explanation?.id,
                    confidence: data.explanation?.confidence,
                    insightsCount: data.insights?.length || 0,
                    recommendationsCount: data.recommendations?.length || 0
                });
            } else {
                throw new Error((response as any).message || 'Error generando explicación');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error generando explicación de IA', { error: err, module, context });
        } finally {
            setLoading(false);
        }
    }, [user?.organizationId, module, context, analysisType, depth, language, onExplanationGenerated]);

    useEffect(() => {
        generateExplanation();
    }, [generateExplanation]);

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <Error color="error" />;
            case 'high': return <Warning color="warning" />;
            case 'medium': return <Info color="info" />;
            case 'low': return <CheckCircle color="success" />;
            default: return <Info />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Psychology color="primary" />
                        <Typography variant="h6">Generando Análisis de IA</Typography>
                    </Box>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Analizando datos reales del sistema...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">
                        <Typography variant="h6">Error en Análisis de IA</Typography>
                        <Typography variant="body2">{error}</Typography>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (!explanation) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        No se pudo generar la explicación de IA.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Explicación Principal */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Psychology color="primary" />
                        <Typography variant="h6">Análisis de IA - {context}</Typography>
                        <Chip
                            label={`${explanation.confidence}% confianza`}
                            color={explanation.confidence > 80 ? 'success' : explanation.confidence > 60 ? 'warning' : 'error'}
                            size="small"
                        />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                        {explanation.explanation}
                    </Typography>

                    {/* Metadatos */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                            icon={<Analytics />}
                            label={`${explanation.metadata.dataPoints} puntos de datos`}
                            size="small"
                            variant="outlined"
                        />
                        <Chip
                            label={`Modelo: ${explanation.metadata.model} v${explanation.metadata.version}`}
                            size="small"
                            variant="outlined"
                        />
                        <Chip
                            label={`Procesado en ${explanation.metadata.processingTime}ms`}
                            size="small"
                            variant="outlined"
                        />
                    </Box>

                    {/* Referencias */}
                    {explanation.references.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Referencias del análisis:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {explanation.references.map((ref, index) => (
                                    <Typography key={index} variant="body2" color="text.secondary">
                                        • {ref}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Evaluación de Riesgo */}
            {riskAssessment && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Warning color={getRiskColor(riskAssessment.overallRisk) as any} />
                            <Typography variant="h6">Evaluación de Riesgo</Typography>
                            <Chip
                                label={riskAssessment.overallRisk.toUpperCase()}
                                color={getRiskColor(riskAssessment.overallRisk) as any}
                                size="small"
                            />
                        </Box>

                        {riskAssessment.riskFactors.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Factores de Riesgo:
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {riskAssessment.riskFactors.map((factor, index) => (
                                        <Typography key={index} variant="body2" color="text.secondary">
                                            • {factor}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {riskAssessment.mitigationStrategies.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Estrategias de Mitigación:
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {riskAssessment.mitigationStrategies.map((strategy, index) => (
                                        <Typography key={index} variant="body2" color="text.secondary">
                                            • {strategy}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Insights */}
            {insights.length > 0 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <TrendingUp color="primary" />
                            <Typography variant="h6">Insights Detectados</Typography>
                        </Box>

                        <Grid container spacing={2}>
                            {insights.map((insight) => (
                                <Grid item xs={12} md={6} key={insight.id}>
                                    <Alert
                                        severity={getSeverityColor(insight.severity) as any}
                                        icon={getSeverityIcon(insight.severity)}
                                        sx={{ height: '100%' }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            {insight.title}
                                        </Typography>
                                        <Typography variant="body2">
                                            {insight.description}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Chip
                                                label={`${insight.confidence}% confianza`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Alert>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Recomendaciones */}
            {recommendations.length > 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Recomendaciones Accionables
                        </Typography>

                        <Grid container spacing={2}>
                            {recommendations.map((rec) => (
                                <Grid item xs={12} key={rec.id}>
                                    <Alert
                                        severity={getSeverityColor(rec.priority) as any}
                                        sx={{ mb: 2 }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            {rec.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {rec.description}
                                        </Typography>

                                        {rec.reasoning.length > 0 && (
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                    Justificación:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {rec.reasoning.map((reason, index) => (
                                                        <Typography key={index} variant="caption">
                                                            • {reason}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}

                                        {rec.steps.length > 0 && (
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                    Pasos a seguir:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {rec.steps.map((step, index) => (
                                                        <Typography key={index} variant="caption">
                                                            {index + 1}. {step}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}

                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Chip
                                                label={`${rec.confidence}% confianza`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            {rec.actionable && (
                                                <Chip
                                                    label="Accionable"
                                                    size="small"
                                                    color="success"
                                                />
                                            )}
                                        </Box>
                                    </Alert>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Estadísticas */}
            {statistics && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Estadísticas del Análisis
                        </Typography>

                        <Grid container spacing={2}>
                            {Object.entries(statistics).map(([key, value]) => (
                                <Grid item xs={6} md={3} key={key}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};
