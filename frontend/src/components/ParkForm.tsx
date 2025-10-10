import React, { useState } from 'react';
import { createPark, updatePark } from '../services/parks';
import { GeometryMapEditor } from './GeometryMapEditor';

interface ParkFormProps {
    token: string;
    initialData?: any;
    onSubmit: () => void;
}

export const ParkForm: React.FC<ParkFormProps> = ({ token, initialData, onSubmit }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [identifier, setIdentifier] = useState(initialData?.identifier || '');
    const [geometry, setGeometry] = useState<null | { type: 'Point'; coordinates: [number, number]; radius: number }>(
        initialData?.geometry ? initialData.geometry : null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!geometry) {
                setError('Debes seleccionar la ubicación en el mapa.');
                setLoading(false);
                return;
            }
            const data = {
                name,
                identifier,
                geometry,
            };
            if (initialData?.id) {
                await updatePark(initialData.id, data, token);
            } else {
                await createPark(data, token);
            }
            onSubmit();
        } catch (err: any) {
            setError(err.message || 'Error al guardar parque');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>{initialData ? 'Editar parque' : 'Crear parque'}</h3>
            <div>
                <label>Nombre:</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
                <label>Identificador:</label>
                <input value={identifier} onChange={e => setIdentifier(e.target.value)} required />
            </div>
            <div>
                <label>Geometría (selecciona en el mapa):</label>
                <GeometryMapEditor geometry={geometry} onChange={setGeometry} disabled={loading} />
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit" disabled={loading || !geometry}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </form>
    );
}; 