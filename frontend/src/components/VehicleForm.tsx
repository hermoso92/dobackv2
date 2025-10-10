import React, { useState } from 'react';
import { createVehicle, updateVehicle } from '../services/vehicles';

interface VehicleFormProps {
    token: string;
    parkId?: string;
    initialData?: any;
    onSubmit: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ token, parkId, initialData, onSubmit }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [identifier, setIdentifier] = useState(initialData?.identifier || '');
    const [licensePlate, setLicensePlate] = useState(initialData?.licensePlate || '');
    const [model, setModel] = useState(initialData?.model || '');
    const [type, setType] = useState(initialData?.type || 'TRUCK');
    const [status, setStatus] = useState(initialData?.status || 'ACTIVE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data: any = {
                name,
                identifier,
                licensePlate,
                model,
                type,
                status,
            };
            if (parkId) data.parkId = parkId;
            if (initialData?.id) {
                await updateVehicle(initialData.id, data, token);
            } else {
                await createVehicle(data, token);
            }
            onSubmit();
        } catch (err: any) {
            setError(err.message || 'Error al guardar vehículo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>{initialData ? 'Editar vehículo' : 'Crear vehículo'}</h3>
            <div>
                <label>Nombre:</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
                <label>Identificador:</label>
                <input value={identifier} onChange={e => setIdentifier(e.target.value)} required />
            </div>
            <div>
                <label>Matrícula:</label>
                <input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} required />
            </div>
            <div>
                <label>Modelo:</label>
                <input value={model} onChange={e => setModel(e.target.value)} required />
            </div>
            <div>
                <label>Tipo:</label>
                <select value={type} onChange={e => setType(e.target.value)}>
                    <option value="TRUCK">Camión</option>
                    <option value="VAN">Furgoneta</option>
                    <option value="CAR">Coche</option>
                    <option value="BUS">Autobús</option>
                    <option value="MOTORCYCLE">Moto</option>
                    <option value="OTHER">Otro</option>
                </select>
            </div>
            <div>
                <label>Estado:</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="REPAIR">Reparación</option>
                </select>
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </form>
    );
}; 