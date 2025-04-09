// types/colaborador.d.ts
export type ColaboradorRol = 'vendedor' | 'gestor_entregas' | 'gestor_cobros' | 'admin';

export interface Colaborador {
  id: string;
  actividad_id: string;
  nombre: string;
  telefono?: string;
  rol: ColaboradorRol;
  codigo_acceso: string;
  codigo_qr: string;
  codigo_venta?: string;
  codigo_venta_qr?: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ColaboradorFormData {
  nombre: string;
  telefono: string;
  rol: ColaboradorRol;
  activo: boolean;
}

// Estadísticas de colaboradores
export interface ColaboradoresStats {
  total: number;
  activos: number;
  inactivos: number;
  por_rol: Record<ColaboradorRol, number>;
}

// Notificación para el sistema de UI
export interface UINotification {
  mostrar: boolean;
  mensaje: string;
  tipo: 'exito' | 'error' | 'warning' | 'info';
  duracion?: number;
}
