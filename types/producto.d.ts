// types/producto.d.ts
export type ProductoTipo = 'plato' | 'bebida' | 'postre' | 'otro';

export interface Producto {
    id: string;
    actividad_id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    tipo: ProductoTipo;
    disponible: boolean;
    imagen_url?: string;
    destacado?: boolean;
    stock?: number;
    created_at?: string;
    updated_at?: string;
}

// Interfaz para el formulario de producto
export interface ProductoFormData {
    nombre: string;
    descripcion: string;
    precio: number;
    tipo: ProductoTipo;
    disponible: boolean;
    imagen_url?: string;
}

// Estadísticas de productos
export interface ProductosStats {
    total: number;
    disponibles: number;
    agotados: number;
}
