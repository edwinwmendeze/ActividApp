/**
 * Utility formatters for ActividApp
 * Functions for formatting dates, product types, and other common data
 */

// Formatea una fecha a formato legible en español
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No especificada';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Formatea un precio a formato monetario en soles
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount);
}

// Formato simple de precio con símbolo S/
export function formatPrice(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

// Convierte el código de tipo de producto a texto legible
export function formatearTipo(tipo: string): string {
  const tipos: Record<string, string> = {
    plato: 'Plato',
    bebida: 'Bebida',
    postre: 'Postre',
    otro: 'Otro'
  };
  
  return tipos[tipo] || tipo;
}

// Obtiene un emoji representativo según el tipo de producto
export function obtenerEmoji(tipo: string): string {
  const emojis: Record<string, string> = {
    plato: '🍽️',
    bebida: '🥤',
    postre: '🍰',
    otro: '📦'
  };
  
  return emojis[tipo] || '📦';
}