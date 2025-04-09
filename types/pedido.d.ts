// types/pedido.d.ts
import type { Producto } from './producto';

export interface Pedido {
    id: string;
    actividad_id: string;
    colaborador_id?: string;
    cliente_nombre: string;
    cliente_telefono?: string;
    estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'cancelado';
    metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
    total: number;
    requiere_delivery: boolean;
    direccion_entrega?: string;
    notas?: string;
    created_at: string;
    updated_at?: string;
}

export interface PedidoItem {
    id: string;
    pedido_id: string;
    producto_id: string;
    producto?: Producto;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    notas?: string;
}

export interface PedidoFormData {
    cliente_nombre: string;
    cliente_telefono?: string;
    metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
    requiere_delivery: boolean;
    direccion_entrega?: string;
    notas?: string;
    items: {
        producto_id: string;
        cantidad: number;
        notas?: string;
    }[];
}

// Estadísticas de pedidos
export interface PedidosStats {
    total: number;
    pendientes: number;
    completados: number;
    cancelados: number;
    total_ventas: number;
}
