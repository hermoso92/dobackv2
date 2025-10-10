export interface Usuario {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: 'ADMIN' | 'OPERADOR' | 'SUPERVISOR';
    organizacionId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Vehiculo {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    anio: number;
    organizacionId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Sesion {
    id: string;
    vehiculoId: string;
    fechaInicio: Date;
    fechaFin?: Date;
    estado: 'ACTIVA' | 'FINALIZADA';
    createdAt: Date;
    updatedAt: Date;
}

export interface Telemetria {
    id: string;
    sesionId: string;
    tipo: 'CAN' | 'GPS' | 'ESTABILIDAD';
    datos: Record<string, any>;
    timestamp: Date;
    createdAt: Date;
}

export interface GestorDeEvento {
    id: string;
    tipo: 'ALARMA' | 'ALERTA' | 'CONDICION_CRITICA';
    severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
    descripcion: string;
    vehiculoId: string;
    sesionId?: string;
    asignadoA?: string;
    resueltoPor?: string;
    fechaCreacion: Date;
    fechaResolucion?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Mantenimiento {
    id: string;
    vehiculoId: string;
    tipo: 'PREVENTIVO' | 'CORRECTIVO';
    descripcion: string;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
    fechaProgramada: Date;
    fechaCompletado?: Date;
    asignadoA?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Notificacion {
    id: string;
    tipo: 'EMAIL' | 'SMS' | 'PUSH';
    destinatario: string;
    mensaje: string;
    estado: 'PENDIENTE' | 'ENVIADA' | 'RECIBIDA';
    fechaEnvio?: Date;
    fechaRecepcion?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Organizacion {
    id: string;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditLog {
    id: string;
    accion: string;
    entidad: string;
    entidadId: string;
    usuarioId?: string;
    detalles: Record<string, any>;
    timestamp: Date;
    createdAt: Date;
}
