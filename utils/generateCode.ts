// utils/generateCode.ts

/**
 * Genera un código alfanumérico aleatorio
 * @param length Longitud del código (por defecto 6)
 * @returns Código generado
 */
export function generateUniqueCode(length = 6): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluimos caracteres confusos (O, 0, I, 1)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }