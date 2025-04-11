// utils/formatters.ts
export function formatDate(dateString: string): string {
    if (!dateString) return 'No disponible';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  export function formatTime(dateString: string): string {
    if (!dateString) return 'No disponible';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  export function formatearEstado(estado: string): string {
    const estados: Record<string, string> = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Listo',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    
    return estados[estado] || estado;
  }