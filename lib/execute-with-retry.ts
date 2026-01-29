/**
 * Wrapper global para ejecutar funciones con retry automático
 * Reintenta automáticamente si falla con "Too Many Requests" o errores de conexión
 */

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'Unknown Operation'
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn()
      return result
    } catch (error: any) {
      const errorMessage = error?.message || JSON.stringify(error)
      
      // Detectar si es un error de rate limiting
      const isTooManyRequests = 
        errorMessage.includes('Too Many') || 
        errorMessage.includes('429') ||
        errorMessage.includes('is not valid JSON') ||
        errorMessage.includes('Rate limit') ||
        errorMessage.includes('RATE_LIMIT') ||
        errorMessage.includes('Request error') ||
        errorMessage.includes('Connection timeout')
      
      const isLastAttempt = attempt === maxRetries - 1
      
      if (isTooManyRequests && !isLastAttempt) {
        // Esperar con backoff exponencial
        const waitTime = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s...
        console.log(
          `[v0] ${context} - Rate limited (attempt ${attempt + 1}/${maxRetries}), ` +
          `esperando ${waitTime / 1000}s antes de reintentar...`
        )
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      
      // Si no es rate limiting o es el último intento, lanzar el error
      throw error
    }
  }
  
  throw new Error(`[v0] ${context} - Failed after ${maxRetries} attempts`)
}

/**
 * Versión wrapper para server actions que retorna { success, data, error }
 */
export async function executeServerActionWithRetry<T>(
  fn: () => Promise<{ success: boolean; data?: T; error?: string }>,
  context: string = 'Unknown Operation',
  maxRetries: number = 3
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await executeWithRetry(fn, maxRetries, context)
    return result
  } catch (error: any) {
    console.error(`[v0] ${context} - Final error:`, error?.message || error)
    return {
      success: false,
      error: error?.message || 'Error desconocido durante la operación',
    }
  }
}
