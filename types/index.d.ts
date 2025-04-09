  export interface Colaborador {
    id?: string;
    actividad_id?: string;
    nombre: string;
    telefono: string;
    rol?: ColaboradorRol; // This can be undefined
    codigo_acceso: string;
    codigo_qr: string;
    codigo_venta: string;
    codigo_venta_qr: string;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
  }