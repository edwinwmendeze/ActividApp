// types/actividad.d.ts
export interface Actividad {
    id: string;
    nombre: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion?: string;
    organizador_nombre: string;
    organizador_telefono?: string;
    organizador_email?: string;
    codigo_acceso: string;
    codigo_qr: string;
    permite_delivery: boolean;
    costo_delivery: number;
    estado: 'activa' | 'pausada' | 'finalizada' | 'cancelada';
    created_at: string;
}