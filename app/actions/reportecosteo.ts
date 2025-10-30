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
export async function obtenerReporteCosteo(productosid: number, clientesid: number) {
  try {
    // Ejecutar la función RPC de Supabase
    const { data, error } = await supabase.rpc("reportecosteo", {
      productosid,
      clientesid,
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
