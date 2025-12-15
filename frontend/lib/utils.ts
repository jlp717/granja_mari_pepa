import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Corrige caracteres mal codificados del AS/400 (EBCDIC -> UTF-8)
 * Restaura los caracteres españoles correctos (ñ, á, é, etc.)
 * 
 * @param text - Texto a corregir
 * @returns Texto con caracteres españoles correctos
 */
export function fixAS400Encoding(text: string | null | undefined): string {
  if (!text) return '';
  
  let result = String(text);
  
  // Corregir caracteres mal codificados del AS/400 (EBCDIC -> UTF-8)
  // El AS/400 usa EBCDIC y la conversión a UTF-8 a veces produce estos patrones
  result = result.replace(/\u00ff\u00fd/g, 'Ñ');  // ÿý -> Ñ
  result = result.replace(/\u00c3\u00b1/g, 'ñ');   // Ã± -> ñ
  result = result.replace(/\u00c3\u0091/g, 'Ñ');   // Ã' -> Ñ  
  result = result.replace(/\u00c3\u00a1/g, 'á');   // Ã¡ -> á
  result = result.replace(/\u00c3\u00a9/g, 'é');   // Ã© -> é
  result = result.replace(/\u00c3\u00ad/g, 'í');   // Ã­ -> í
  result = result.replace(/\u00c3\u00b3/g, 'ó');   // Ã³ -> ó
  result = result.replace(/\u00c3\u00ba/g, 'ú');   // Ãº -> ú
  result = result.replace(/\u00c3\u00bc/g, 'ü');   // Ã¼ -> ü
  result = result.replace(/\u00c3\u0081/g, 'Á');   // ÃÁ -> Á
  result = result.replace(/\u00c3\u0089/g, 'É');   // ÃÉ -> É
  result = result.replace(/\u00c3\u008d/g, 'Í');   // ÃÍ -> Í
  result = result.replace(/\u00c3\u0093/g, 'Ó');   // ÃÓ -> Ó
  result = result.replace(/\u00c3\u009a/g, 'Ú');   // ÃÚ -> Ú
  
  return result;
}

/**
 * Formatea un número como moneda en formato español
 * @param amount - Cantidad a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado: "1.234,56 €"
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formatea un número como moneda sin decimales
 * @param amount - Cantidad a formatear
 * @returns String formateado: "1.234 €"
 */
export function formatCurrencyNoDecimals(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
