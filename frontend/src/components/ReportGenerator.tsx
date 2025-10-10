import React, { useState } from 'react';
import { useReportGeneration } from '../hooks/useReportGeneration';

interface ReportGeneratorProps {
    token: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ token }) => {
    const [type, setType] = useState<'vehicle' | 'park'>('vehicle');
    const [id, setId] = useState('');
    const [date, setDate] = useState('');
    const { reportId, loading, error, requestReport, downloadReport } = useReportGeneration(token);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await requestReport({ type, id, date });
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8 }}>
            <h3>Generar informe PDF</h3>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Tipo:</label>
                    <select value={type} onChange={e => setType(e.target.value as 'vehicle' | 'park')}>
                        <option value="vehicle">Vehículo</option>
                        <option value="park">Parque</option>
                    </select>
                </div>
                <div>
                    <label>ID:</label>
                    <input value={id} onChange={e => setId(e.target.value)} required />
                </div>
                <div>
                    <label>Fecha (YYYY-MM-DD):</label>
                    <input value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <button type="submit" disabled={loading}>{loading ? 'Generando...' : 'Generar informe'}</button>
            </form>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {reportId && (
                <div>
                    <span>Informe generado. </span>
                    <button onClick={downloadReport}>Descargar PDF</button>
                </div>
            )}
        </div>
    );
}; 