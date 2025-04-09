// types/venta.d.ts
import type { Pedido } from './pedido';
import type { Colaborador } from './colaborador';

export interface Venta {
    id: string;
    pedido_id: string;
    pedido?: Pedido;
    colaborador_id?: string;
    colaborador?: Colaborador;
    fecha_venta: string;
    monto_total: number;
    comision?: number;
    metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
    estado: 'completada' | 'anulada';
    notas?: string;
    created_at: string;
    updated_at?: string;
}

export interface VentaStats {
    total: number;
    hoy: number;
    semana: number;
    mes: number;
    promedio_diario?: number;
    por_colaborador?: Record<string, number>;
}