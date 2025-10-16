import React from 'react';
import { useGeocoding } from '../hooks/useGeocoding';

interface ClusterPopupProps {
    cluster: any;
    onShowDetails: (cluster: any) => void;
}

const ClusterPopup: React.FC<ClusterPopupProps> = ({ cluster, onShowDetails }) => {
    const { address, loading: geocodingLoading } = useGeocoding(cluster.lat, cluster.lng, {
        fallbackToCoords: true
    });

    const displayLocation = geocodingLoading ? 'Cargando dirección...' : (address || cluster.location);

    return (
        <div style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            maxWidth: '380px',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
            {/* Header con ubicación */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b, #334155)',
                color: 'white',
                padding: '16px 20px',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        📍 {displayLocation}
                    </div>
                </div>
            </div>

            {/* Estadísticas principales */}
            <div style={{
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                borderBottom: '1px solid #e5e7eb'
            }}>
                <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>TOTAL EVENTOS</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{cluster.frequency}</div>
                </div>
                <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>VEHÍCULOS</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{cluster.vehicleIds?.length || 0}</div>
                </div>
            </div>

            {/* Severidades con badges coloreados */}
            <div style={{ padding: '16px 20px' }}>
                <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                    🚨 Eventos por Severidad
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca'
                    }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626' }}>🔴 Graves</span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#991b1b' }}>
                            {cluster.severity_counts?.grave || 0}
                        </span>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa'
                    }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#ea580c' }}>🟠 Moderadas</span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#c2410c' }}>
                            {cluster.severity_counts?.moderada || 0}
                        </span>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: '#fefce8',
                        border: '1px solid #fde047'
                    }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#ca8a04' }}>🟡 Leves</span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#a16207' }}>
                            {cluster.severity_counts?.leve || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Vehículos involucrados */}
            {cluster.events && cluster.events.length > 0 && (
                <div style={{ padding: '0 20px 16px 20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        🚒 Vehículos Involucrados
                    </div>
                    <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                        {[...new Set(cluster.events.map((e: any) => e.vehicleName || e.vehicleId))].map((vehicleName: any, idx: number) => (
                            <div key={idx} style={{
                                background: '#dbeafe',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                marginBottom: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#1e40af',
                                border: '1px solid #93c5fd'
                            }}>
                                🚒 {vehicleName}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Última ocurrencia */}
            <div style={{
                padding: '12px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e5e7eb'
            }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>📅 Última Ocurrencia</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    {cluster.lastOccurrence ? new Date(cluster.lastOccurrence).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'N/A'}
                </div>
            </div>

            {/* Botón para ver detalles */}
            <div style={{
                padding: '16px 20px',
                background: '#f1f5f9',
                borderTop: '1px solid #e2e8f0'
            }}>
                <button
                    onClick={() => onShowDetails(cluster)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1e40af)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                    }}
                >
                    🔍 Ver Detalles de Eventos
                </button>
            </div>

            {/* Coordenadas */}
            <div style={{
                padding: '8px 20px',
                background: '#f1f5f9',
                fontSize: '11px',
                color: '#64748b',
                textAlign: 'center',
                borderTop: '1px solid #e2e8f0'
            }}>
                📍 {cluster.lat.toFixed(6)}, {cluster.lng.toFixed(6)}
            </div>
        </div>
    );
};

export default ClusterPopup;
