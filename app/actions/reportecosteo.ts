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
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Funciones
================================================== */

// Función: obtenerReporteCosteo: Ejecuta la función RPC de Supabase para obtener el reporte de costeo
export async function obtenerReporteCosteo(productosid: number, clientesid: number, zonasid: number) {
  try {
    // Ejecutar la función RPC de Supabase
    const { data, error } = await supabase.rpc("reportecosteo", {
      productosid,
      clientesid,
      zonasid,
    })

    if (error) {
      console.error("Error obteniendo reporte de costeo en obtenerReporteCosteo:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerReporteCosteo:", error)
    return { success: false, error: "Error interno del servidor al ejecutar obtenerReporteCosteo" }
  }
}

// Función: recalcularCotizacionReporte: Ejecuta la función RPC de Supabase para recalcular cotización desde el reporte
export async function recalcularCotizacionReporte(
  productosid: number,
  clientesid: number,
  zonasid: number,
  preciosiniva: number,
  forecasts: number,
) {
  try {
    const { data, error } = await supabase.rpc("reportecosteocalculo", {
      productosid,
      clientesid,
      zonasid,
      preciosiniva,
      forecasts,
    })

    if (error) {
      console.error("Error en recalcularCotizacionReporte:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data?.[0] || null }
  } catch (error) {
    console.error("Error en recalcularCotizacionReporte:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function actualizarRegistrosModificados(registrosModificados: any[], clienteid: number) {
  try {
    const errores: string[] = []
    let actualizadosProductosXCliente = 0
    let actualizadosOptimos25 = 0
    let actualizadosOptimos30 = 0

    for (const registro of registrosModificados) {
      const productoid = registro.folio

      // 1. Actualizar productosxcliente (datos con utilidad optima 25)
      const updateProductosXCliente = {
        plangeneracional: registro.splangeneracional,
        plannivel: registro.splannivel,
        planinfinito: registro.splaninfinito,
        ivapagado: registro.sivapagado,
        cda: registro.scda,
        bonoiniciorapido: registro.sbonoiniciorapido,
        constructoriniciorapido: registro.sconstructoriniciorapido,
        rutaexito: registro.srutaexito,
        reembolsos: registro.sreembolsos,
        tarjetacredito: registro.starjetacredito,
        envio: registro.senvio,
        preciohl: registro.spreciohl,
        porcentajecosto: registro.sporcentajecosto,
        totalcostos: registro.stotalcostos,
        utilidadmarginal: registro.sutilidadmarginal,
        precioactualporcentajeutilidad: registro.sprecioactualporcentajeutilidad,
        precioventasiniva: registro.sprecioventasiniva,
        precioventaconiva: registro.sprecioventaconiva,
        precioventaconivaaa: registro.sprecioventaconivaaa,
        fechamodificacion: new Date().toISOString(),
      }

      const { error: errorPxC } = await supabase
        .from("productosxcliente")
        .update(updateProductosXCliente)
        .eq("productoid", productoid)
        .eq("clienteid", clienteid)

      if (errorPxC) {
        errores.push(`Error actualizando productosxcliente para producto ${productoid}: ${errorPxC.message}`)
      } else {
        actualizadosProductosXCliente++
      }

      // 2. Actualizar productosxclienteoptimos con utilidadoptima = 25
      const updateOptimos25 = {
        comisiones_porcentaje: registro.scomisiones_porcentaje / 100,
        costo_porcentaje: registro.scosto_porcentaje / 100,
        comisionesmascosto: registro.scomisionesmascosto,
        precioventasiniva: registro.sprecioventasiniva,
        preciometa: registro.spreciometa,
        preciometaconiva: registro.spreciometaconiva,
        diferenciautilidadesperada: registro.sdiferenciautilidadesperada,
        precioventaconivaaa: registro.sprecioventaconivaaa,
        fechamodificacion: new Date().toISOString(),
      }

      const { error: errorOpt25 } = await supabase
        .from("productosxclienteoptimos")
        .update(updateOptimos25)
        .eq("productoid", productoid)
        .eq("clienteid", clienteid)
        .eq("utilidadoptima", 25)

      if (errorOpt25) {
        errores.push(
          `Error actualizando productosxclienteoptimos (25%) para producto ${productoid}: ${errorOpt25.message}`,
        )
      } else {
        actualizadosOptimos25++
      }

      // 3. Actualizar productosxclienteoptimos con utilidadoptima = 30
      const updateOptimos30 = {
        comisiones_porcentaje: registro.scomisiones_porcentaje30 / 100,
        costo_porcentaje: registro.scosto_porcentaje30 / 100,
        comisionesmascosto: registro.scomisionesmascosto30,
        precioventasiniva: registro.sprecioventasiniva30,
        preciometa: registro.spreciometa30,
        preciometaconiva: registro.spreciometaconiva30,
        diferenciautilidadesperada: registro.sdiferenciautilidadesperada30,
        precioventaconivaaa: registro.sprecioventaconivaaa,
        fechamodificacion: new Date().toISOString(),
      }

      const { error: errorOpt30 } = await supabase
        .from("productosxclienteoptimos")
        .update(updateOptimos30)
        .eq("productoid", productoid)
        .eq("clienteid", clienteid)
        .eq("utilidadoptima", 30)

      if (errorOpt30) {
        errores.push(
          `Error actualizando productosxclienteoptimos (30%) para producto ${productoid}: ${errorOpt30.message}`,
        )
      } else {
        actualizadosOptimos30++
      }
    }

    if (errores.length > 0) {
      return {
        success: false,
        error: errores.join("; "),
        actualizados: {
          productosxcliente: actualizadosProductosXCliente,
          optimos25: actualizadosOptimos25,
          optimos30: actualizadosOptimos30,
        },
      }
    }

    return {
      success: true,
      actualizados: {
        productosxcliente: actualizadosProductosXCliente,
        optimos25: actualizadosOptimos25,
        optimos30: actualizadosOptimos30,
      },
    }
  } catch (error) {
    console.error("Error en actualizarRegistrosModificados:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
