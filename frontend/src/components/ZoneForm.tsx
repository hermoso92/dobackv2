import React, { useState } from 'react';
import { createZone, updateZone } from '../services/zones';
import { GeometryMapEditor } from './GeometryMapEditor';

interface ZoneFormProps {
    token: string;
    initialData?: any;
    onSubmit: () => void;
}

export const ZoneForm: React.FC<ZoneFormProps> = ({ token, initialData, onSubmit }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState(initialData?.type || 'parque');
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
                type,
                geometry,
            };
            if (initialData?.id) {
                await updateZone(initialData.id, data, token);
            } else {
                await createZone(data, token);
            }
            onSubmit();
        } catch (err: any) {
            setError(err.message || 'Error al guardar zona');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>{initialData ? 'Editar zona' : 'Crear zona'}</h3>
            <div>
                <label>Nombre:</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
                <label>Tipo:</label>
                <select value={type} onChange={e => setType(e.target.value)} required>
                    <option value="parque">Parque</option>
                    <option value="taller">Taller</option>
                    <option value="sensible">Sensible</option>
                    <option value="hospital">Hospital</option>
                    <option value="base">Base</option>
                    <option value="otro">Otro</option>
                </select>
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