// types/stats.d.ts
export interface DashboardStats {
    totalProductos: number;
    totalColaboradores: number;
    totalPedidos: number;
    totalVentas?: number;
}

export interface ActividadStats {
    pedidosPendientes: number;
    pedidosCompletados: number;
    ingresoTotal: number;
    productosVendidos: number;
}