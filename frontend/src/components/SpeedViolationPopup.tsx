import React from 'react';
import { useGeocoding } from '../hooks/useGeocoding';

interface SpeedViolationPopupProps {
    violation: any;
    getRoadTypeText: (roadType: string) => string;
}

const SpeedViolationPopup: React.FC<SpeedViolationPopupProps> = ({ violation, getRoadTypeText }) => {
    const { address, loading: geocodingLoading } = useGeocoding(violation.lat, violation.lng, {
        fallbackToCoords: true
    });

    const getViolationColor = (type: string): string => {
        switch (type) {
            case 'grave':
                return '#EF4444'; // Rojo
            case 'moderado':
                return '#F97316'; // Naranja
            case 'leve':
                return '#F59E0B'; // Amarillo
            default:
                return '#9CA3AF'; // Gris
        }
    };

    const displayLocation = geocodingLoading ? 'Cargando dirección...' : (address || `${violation.lat.toFixed(4)}, ${violation.lng.toFixed(4)}`);

    return (
        <div style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            maxWidth: '380px',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${getViolationColor(violation.violationType)}, ${getViolationColor(violation.violationType)}dd)`,
                color: 'white',
                padding: '16px 20px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '18px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
                🚗 Exceso de Velocidad
            </div>

            {/* Severidad */}
            <div style={{
                padding: '12px 20px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                color: getViolationColor(violation.violationType),
                background: violation.violationType === 'grave' ? '#ffebee' :
                    violation.violationType === 'moderado' ? '#fff3e0' : '#fef3c7',
                borderBottom: '1px solid #eee'
            }}>
                Clasificación: {violation.violationType.toUpperCase()}
            </div>

            {/* Ubicación */}
            <div style={{
                padding: '12px 20px',
                textAlign: 'center',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                borderBottom: '1px solid #eee',
                background: '#f8fafc'
            }}>
                📍 {displayLocation}
            </div>

            {/* Hora */}
            <div style={{
                padding: '8px 20px',
                textAlign: 'center',
                color: '#666',
                fontSize: '13px',
                borderBottom: '1px solid #eee'
            }}>
                🕐 {new Date(violation.timestamp).toLocaleString('es-ES')}
            </div>

            {/* Datos técnicos en grid */}
            <div style={{
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
            }}>
                {/* Velocidad */}
                <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    background: '#ffebee',
                    border: '2px solid #f44336'
                }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>VELOCIDAD</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d32f2f' }}>
                        {violation.speed} km/h
                    </div>
                </div>

                {/* Límite */}
                <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    background: '#f5f5f5',
                    border: '2px solid #e0e0e0'
                }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>LÍMITE DGT</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#666' }}>
                        {violation.speedLimit} km/h
                    </div>
                </div>

                {/* Exceso */}
                <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    background: '#fff3e0',
                    border: '2px solid #ff9800',
                    gridColumn: 'span 2'
                }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>EXCESO</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f57c00' }}>
                        +{(violation.speed - violation.speedLimit).toFixed(2)} km/h
                    </div>
                </div>
            </div>

            {/* Info adicional */}
            <div style={{
                padding: '12px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #eee',
                fontSize: '12px',
                color: '#475569'
            }}>
                <div style={{ marginBottom: '6px' }}>
                    📍 <strong>Vehículo:</strong> {violation.vehicleName}
                </div>
                <div style={{ marginBottom: '6px' }}>
                    🚨 <strong>Rotativo:</strong> {violation.rotativoOn ? '🔴 Encendido' : '⚪ Apagado'}
                </div>
                <div style={{ marginBottom: '6px' }}>
                    🏞️ <strong>Ubicación:</strong> {violation.inPark ? 'Dentro del parque' : 'Fuera del parque'}
                </div>
                <div>
                    🛣️ <strong>Tipo de vía:</strong> {getRoadTypeText(violation.roadType)}
                </div>
            </div>

            {/* Coordenadas */}
            <div style={{
                padding: '8px 20px',
                background: '#f1f5f9',
                fontSize: '11px',
                color: '#64748b',
                textAlign: 'center'
            }}>
                📍 {violation.lat.toFixed(6)}, {violation.lng.toFixed(6)}
            </div>
        </div>
    );
};

export default SpeedViolationPopup;
