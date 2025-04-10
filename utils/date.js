/**
 * Utilidades para el manejo de fechas en la aplicación
 * Importante: Se asume que todas las fechas en Supabase están en UTC
 * y deben convertirse a la zona horaria local (Perú = UTC-5) para mostrarlas
 */

/**
 * Convierte una fecha local a UTC para guardar en Supabase
 * @param {Date|string} localDate - Fecha en zona horaria local
 * @returns {string} - Fecha en formato ISO (UTC)
 */
export function toUTC(localDate) {
  const date = localDate instanceof Date ? localDate : new Date(localDate);
  return date.toISOString();
}

/**
 * Convierte una fecha UTC de Supabase a fecha local (Perú = UTC-5)
 * @param {string} utcDate - Fecha UTC en formato ISO
 * @returns {Date} - Fecha convertida a hora local
 */
export function fromUTC(utcDate) {
  return new Date(utcDate);
}

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param {Date|string} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Cambio a formato 24 horas
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  return new Date(date).toLocaleString('es-PE', mergedOptions);
}

/**
 * Formatea una fecha corta (solo fecha sin hora)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export function formatShortDate(date) {
  if (!date) return '';
  
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: undefined,
    minute: undefined,
    hour12: true
  });
}

/**
 * Formatea una fecha mostrando solo la hora (sin fecha)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Hora formateada (formato 12 horas)
 */
export function formatTimeOnly(date) {
  if (!date) return '';
  
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    day: undefined,
    month: undefined,
    year: undefined
  });
}

/**
 * Verifica si una fecha es válida
 * @param {any} date - Valor a verificar
 * @returns {boolean} - True si es una fecha válida
 */
export function isValidDate(date) {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}
