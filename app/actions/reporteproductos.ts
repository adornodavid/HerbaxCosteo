"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function obtenerReporteCatalogoProductos(
  productosid: number,
  clientesid: number,
  zonasid: number,
  categorias: string,
  formasfarmaceuticas: number,
  objetivos: number,
  envases: string,
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Llamar a la función de Supabase
    const { data, error } = await supabase.rpc("reportecatalogoproductos", {
      productosid,
      clientesid,
      zonasid,
      categorias,
      formasfarmaceuticas,
      objetivos,
      envases,
    })

    if (error) {
      console.error("Error en reportecatalogoproductos:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [], error: null }
  } catch (error: any) {
    console.error("Error en obtenerReporteCatalogoProductos:", error)
    return { success: false, error: error.message || "Error desconocido", data: [] }
  }
}
