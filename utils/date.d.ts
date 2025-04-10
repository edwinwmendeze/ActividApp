/**
 * Utilidades para el manejo de fechas en la aplicación
 */

/**
 * Convierte una fecha local a UTC para guardar en Supabase
 * @param {Date|string} localDate - Fecha en zona horaria local
 * @returns {string} - Fecha en formato ISO (UTC)
 */
export function toUTC(localDate: Date | string): string;

/**
 * Convierte una fecha UTC de Supabase a fecha local
 * @param {string} utcDate - Fecha UTC en formato ISO
 * @returns {Date} - Fecha convertida a hora local
 */
export function fromUTC(utcDate: string): Date;

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param {Date|string} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} - Fecha formateada
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;

/**
 * Formatea una fecha corta (solo fecha sin hora)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export function formatShortDate(date: Date | string): string;

/**
 * Formatea una fecha mostrando solo la hora (sin fecha)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Hora formateada (formato 12 horas)
 */
export function formatTimeOnly(date: Date | string): string;

/**
 * Verifica si una fecha es válida
 * @param {any} date - Valor a verificar
 * @returns {boolean} - True si es una fecha válida
 */
export function isValidDate(date: any): boolean;
