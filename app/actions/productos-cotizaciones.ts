"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

/**
 * Operación Plan Generacional
 * Calcula el resultado basado en el precio de venta sin IVA y la categoría
 *
 * @param precioventasiniva - Precio de venta sin IVA
 * @param categoria - Categoría del producto (A u otra)
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionPlanGeneracional(
  precioventasiniva: number,
  categoria: string,
): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variables constantes
    const a = 0.2201
    const b = 0.7

    // Variable para almacenar el resultado
    let resultado: number

    // Filtros y proceso
    if (categoria === "A") {
      // Si la categoría es A, multiplicar precio por variable a
      resultado = precioventasiniva * a
    } else {
      // Si no es A, multiplicar precio por variable a y por variable b
      resultado = precioventasiniva * a * b
    }

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionPlanGeneracional de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Plan Nivel
 * Calcula el resultado basado en el precio de venta sin IVA y la categoría
 *
 * @param precioventasiniva - Precio de venta sin IVA
 * @param categoria - Categoría del producto (A u otra)
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionPlanNivel(
  precioventasiniva: number,
  categoria: string,
): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variables constantes
    const a = 0.2201
    const b = 0.7

    // Variable para almacenar el resultado
    let resultado: number

    // Filtros y proceso
    if (categoria === "A") {
      // Si la categoría es A, multiplicar precio por variable a
      resultado = precioventasiniva * a
    } else {
      // Si no es A, multiplicar precio por variable a y por variable b
      resultado = precioventasiniva * a * b
    }

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionPlanNivel de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Plan Infinito
 * Calcula el resultado basado en el precio de venta sin IVA y la categoría
 *
 * @param precioventasiniva - Precio de venta sin IVA
 * @param categoria - Categoría del producto (A u otra)
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionPlanInfinito(
  precioventasiniva: number,
  categoria: string,
): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variables constantes
    const a = 0.2201
    const b = 0.7

    // Variable para almacenar el resultado
    let resultado: number

    // Filtros y proceso
    if (categoria === "A") {
      // Si la categoría es A, multiplicar precio por variable a
      resultado = precioventasiniva * a
    } else {
      // Si no es A, multiplicar precio por variable a y por variable b
      resultado = precioventasiniva * a * b
    }

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionPlanInfinito de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación IVA Pagado
 * Calcula el resultado basado en el precio de venta sin IVA y la categoría
 *
 * @param precioventasiniva - Precio de venta sin IVA
 * @param categoria - Categoría del producto (A u otra)
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionIVAPagado(
  precioventasiniva: number,
  categoria: string,
): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variables constantes
    const a = 0.2201
    const b = 0.7

    // Variable para almacenar el resultado
    let resultado: number

    // Filtros y proceso
    if (categoria === "A") {
      // Si la categoría es A, multiplicar precio por variable a
      resultado = precioventasiniva * a
    } else {
      // Si no es A, multiplicar precio por variable a y por variable b
      resultado = precioventasiniva * a * b
    }

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionIVAPagado de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Bono Inicio Rápido
 * Calcula el resultado basado en el precio sin IVA
 *
 * @param preciosiniva - Precio sin IVA
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionBonoInicioRapido(preciosiniva: number): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable constante
    const a = 0.0

    // Variable para almacenar el resultado
    let resultado: number

    // Proceso
    resultado = preciosiniva * a

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionBonoInicioRapido de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Constructor Inicio Rápido
 * Calcula el resultado basado en el precio sin IVA
 *
 * @param preciosiniva - Precio sin IVA
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionConstructorInicioRapido(preciosiniva: number): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable constante
    const a = 0.0

    // Variable para almacenar el resultado
    let resultado: number

    // Proceso
    resultado = preciosiniva * a

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionConstructorInicioRapido de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Ruta Éxito
 * Calcula el resultado basado en el precio sin IVA
 *
 * @param preciosiniva - Precio sin IVA
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionRutaExito(preciosiniva: number): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable constante
    const a = 0.0

    // Variable para almacenar el resultado
    let resultado: number

    // Proceso
    resultado = preciosiniva * a

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionRutaExito de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Reembolsos
 * Calcula el resultado basado en el precio sin IVA
 *
 * @param preciosiniva - Precio sin IVA
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionReembolsos(preciosiniva: number): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable constante
    const a = 0.0

    // Variable para almacenar el resultado
    let resultado: number

    // Proceso
    resultado = preciosiniva * a

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionReembolsos de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Tarjeta de Crédito
 * Calcula el resultado basado en el precio sin IVA
 *
 * @param preciosiniva - Precio sin IVA
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionTarjetaCredito(preciosiniva: number): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable constante
    const a = 0.0

    // Variable para almacenar el resultado
    let resultado: number

    // Proceso
    resultado = preciosiniva * a

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionTarjetaCredito de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Envío
 * Función pendiente de implementación
 */
export async function operacionEnvio() {
  // Función vacía - se completará más adelante
}

/**
 * Operación Costo Producto
 * Función pendiente de implementación
 */
export async function operacionCostoProducto() {
  // Función vacía - se completará más adelante
}

/**
 * Operación CDA
 * Función pendiente de implementación
 */
export async function operacionCDA() {
  // Función vacía - se completará más adelante
}

/**
 * Operación Porcentaje Costo
 * Calcula el porcentaje de costo dividiendo el precio HL entre el precio de venta sin IVA
 *
 * @param preciohl - Precio HL
 * @param precioventasiniva - Precio de venta sin IVA
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionPorcentajeCosto(
  preciohl: number,
  precioventasiniva: number,
): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable para almacenar el resultado
    let resultado: number

    // Proceso: dividir preciohl entre precioventasiniva
    resultado = preciohl / precioventasiniva

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionPorcentajeCosto de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Total Costos
 * Calcula el total de costos sumando todos los parámetros recibidos
 *
 * @param plangeneracional - Costo plan generacional
 * @param plannivel - Costo plan nivel
 * @param planinfinito - Costo plan infinito
 * @param ivapagado - IVA pagado
 * @param cda - CDA
 * @param bonoiniciorapido - Bono inicio rápido
 * @param constructoriniciorapido - Constructor inicio rápido
 * @param rutaexito - Ruta éxito
 * @param reembolsos - Reembolsos
 * @param tarjetacredito - Tarjeta de crédito
 * @param envio - Envío
 * @param preciohl - Precio HL
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionTotalCostos(
  plangeneracional: number,
  plannivel: number,
  planinfinito: number,
  ivapagado: number,
  cda: number,
  bonoiniciorapido: number,
  constructoriniciorapido: number,
  rutaexito: number,
  reembolsos: number,
  tarjetacredito: number,
  envio: number,
  preciohl: number,
): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable para almacenar el resultado
    let resultado: number

    // Proceso: sumar todos los parámetros
    resultado =
      plangeneracional +
      plannivel +
      planinfinito +
      ivapagado +
      cda +
      bonoiniciorapido +
      constructoriniciorapido +
      rutaexito +
      reembolsos +
      tarjetacredito +
      envio +
      preciohl

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionTotalCostos de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Utilidad Marginal
 * Calcula la utilidad marginal restando el total de costos del precio de venta sin IVA
 *
 * @param precioventasiniva - Precio de venta sin IVA
 * @param totalcostos - Total de costos
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionUtilidadMarginal(
  precioventasiniva: number,
  totalcostos: number,
): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable para almacenar el resultado
    let resultado: number

    // Proceso: restar totalcostos de precioventasiniva
    resultado = precioventasiniva - totalcostos

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionUtilidadMarginal de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Operación Precio Actual Porcentaje Utilidad
 * Calcula el porcentaje de utilidad dividiendo la utilidad marginal entre el precio de venta sin IVA
 *
 * @param precioventasiniva - Precio de venta sin IVA
 * @param utilidadmarginal - Utilidad marginal
 * @returns Objeto con success, error (si aplica) y data (resultado del cálculo)
 */
export async function operacionPrecioActualPorcentajeUtilidad(
  precioventasiniva: number,
  utilidadmarginal: number,
): Promise<{
  success: boolean
  error?: string
  data?: number
}> {
  try {
    // Variable para almacenar el resultado
    let resultado: number

    // Proceso: dividir utilidadmarginal entre precioventasiniva
    resultado = utilidadmarginal / precioventasiniva

    // Retorno exitoso
    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función operacionPrecioActualPorcentajeUtilidad de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Cotización Producto
 * Consulta la función de Supabase cotizacionProducto
 *
 * @param productoid - ID del producto
 * @param clienteid - ID del cliente
 * @returns Objeto con success, error (si aplica) y data (resultado de la consulta)
 */
export async function cotizacionProducto(
  productoid: number,
  clienteid: number,
  zonaid: number,
): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    // Consultar la función en Supabase
    const { data, error } = await supabase.rpc("cotizacionproducto", {
      productosid: productoid,
      clientesid: clienteid,
      zonasid: zonaid,
    })

    if (error) {
      return {
        success: false,
        error: `Error al consultar cotizacionproducto: ${error.message}`,
      }
    }

    // Retorno exitoso
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función cotizacionproducto de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Cotización Óptima 25
 * Consulta la función de Supabase cotizacionOptima25
 *
 * @param productoid - ID del producto
 * @param clienteid - ID del cliente
 * @returns Objeto con success, error (si aplica) y data (resultado de la consulta)
 */
export async function cotizacionOptima25(
  productoid: number,
  clienteid: number,
): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    // Consultar la función en Supabase
    const { data, error } = await supabase.rpc("cotizacionoptima25", {
      productosid: productoid,
      clientesid: clienteid,
    })

    if (error) {
      return {
        success: false,
        error: `Error al consultar cotizacionoptima25: ${error.message}`,
      }
    }

    // Retorno exitoso
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función cotizacionoptima25 de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Cotización Óptima 30
 * Consulta la función de Supabase cotizacionOptima30
 *
 * @param productoid - ID del producto
 * @param clienteid - ID del cliente
 * @returns Objeto con success, error (si aplica) y data (resultado de la consulta)
 */
export async function cotizacionOptima30(
  productoid: number,
  clienteid: number,
): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    // Consultar la función en Supabase
    const { data, error } = await supabase.rpc("cotizacionoptima30", {
      productosid: productoid,
      clientesid: clienteid,
    })

    if (error) {
      return {
        success: false,
        error: `Error al consultar cotizacionoptima30: ${error.message}`,
      }
    }

    // Retorno exitoso
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función cotizacionoptima30 de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Calcular Cotización
 * Consulta la función de Supabase calcularCotizacion
 *
 * @param productoid - ID del producto
 * @param clienteid - ID del cliente
 * @param precioventasiniva - Precio de venta sin IVA
 * @returns Objeto con success, error (si aplica) y data (resultado de la consulta)
 */
export async function calcularCotizacion(
  productoid: number,
  clienteid: number,
  precioventasiniva: number,
  forecast: number,
  PorcentajeGeneracional: number,
  PorcentajeNivel: number,
  PorcentajeInfinito: number,
  PorcentajeIva: number,
  PorcentajeBonoRapido: number,
  PorcentajeCDA: number,
  PorcentajeConstructor: number,
  PorcentajeRuta: number,
  PorcentajeReembolsos: number,
  PorcentajeTarjeta: number,
  PorcentajeEnvio: number,
  conversionMoneda: number,
): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    // Consultar la función en Supabase
    const { data, error } = await supabase.rpc("calcularcotizacion", {
      productosid: productoid,
      clientesid: clienteid,
      preciosiniva: precioventasiniva,
      forecasts: forecast,
      porcentajegeneracional: PorcentajeGeneracional,
      porcentajenivel: PorcentajeNivel,
      porcentajeinfinito: PorcentajeInfinito,
      porcentajeiva: PorcentajeIva,
      porcentajebonorapido: PorcentajeBonoRapido,
      porcentajecda: PorcentajeCDA,
      porcentajeconstructor: PorcentajeConstructor,
      porcentajeruta: PorcentajeRuta,
      porcentajereembolsos: PorcentajeReembolsos,
      porcentajetarjeta: PorcentajeTarjeta,
      porcentajeenvio: PorcentajeEnvio,
      conversionmoneda: conversionMoneda,
    })

    if (error) {
      return {
        success: false,
        error: `Error al consultar calcularcotizacion: ${error.message}`,
      }
    }

    // Retorno exitoso
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función calcularcotizacion de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Actualizar Cotización
 * Consulta la función de Supabase actualizarCotizacion
 *
 * @param productoid - ID del producto
 * @param clienteid - ID del cliente
 * @param precioventasiniva - Precio de venta sin IVA
 * @returns Objeto con success, error (si aplica) y data (resultado de la consulta)
 */
export async function actualizarCotizacion(
  productoid: number,
  clienteid: number,
  precioventasiniva: number,
  forecast: number,
  PorcentajeGeneracional: number,
  PorcentajeNivel: number,
  PorcentajeInfinito: number,
  PorcentajeIva: number,
  PorcentajeBonoRapido: number,
  PorcentajeCDA: number,
  PorcentajeConstructor: number,
  PorcentajeRuta: number,
  PorcentajeReembolsos: number,
  PorcentajeTarjeta: number,
  PorcentajeEnvio: number,
  conversionMoneda: number,
): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    // Consultar la función en Supabase
    const { data, error } = await supabase.rpc("actualizarcotizacion", {
      productosid: productoid,
      clientesid: clienteid,
      preciosiniva: precioventasiniva,
      forecasts: forecast,
      porcentajegeneracional: PorcentajeGeneracional,
      porcentajenivel: PorcentajeNivel,
      porcentajeinfinito: PorcentajeInfinito,
      porcentajeiva: PorcentajeIva,
      porcentajebonorapido: PorcentajeBonoRapido,
      porcentajecda: PorcentajeCDA,
      porcentajeconstructor: PorcentajeConstructor,
      porcentajeruta: PorcentajeRuta,
      porcentajereembolsos: PorcentajeReembolsos,
      porcentajetarjeta: PorcentajeTarjeta,
      porcentajeenvio: PorcentajeEnvio,
      conversionmoneda: conversionMoneda,
    })

    if (error) {
      return {
        success: false,
        error: `Error al consultar actualizarcotizacion: ${error.message}`,
      }
    }

    // Retorno exitoso
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    // Retorno con error
    return {
      success: false,
      error: `Ocurrió un error en la función actualizarcotizacion de app/actions/productos-cotizaciones: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
