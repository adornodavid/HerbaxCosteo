"use server"

import { createClient } from "@/lib/supabase-server"
import type { aResultadoAccion } from "@/types/common.types"

/**
 * Obtiene el inventario de productos desde la vista vw_inventarios
 * @param clienteid - ID del cliente para filtrar
 * @param zonaid - ID de la zona para filtrar
 * @returns Resultado con los datos del inventario
 */
export async function obtenerInventario(clienteid: number, zonaid: number): Promise<aResultadoAccion> {
  try {
    const supabase = await createClient()

    let query = supabase.from("vw_inventarios").select("*").order("nombre", { ascending: true })

    // Aplicar filtros
    if (clienteid > 0) {
      query = query.eq("clienteid", clienteid)
    }

    if (zonaid > 0) {
      query = query.eq("zonaid", zonaid)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener inventario:", error)
      return {
        success: false,
        error: `Error al obtener inventario: ${error.message}`,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error("Error en obtenerInventario:", error)
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Actualiza múltiples registros de inventario
 * @param records - Array de registros a actualizar
 * @returns Resultado de la actualización
 */
export async function actualizarInventarios(records: any[]): Promise<aResultadoAccion> {
  try {
    console.log("[v0] Actualizando inventarios. Registros modificados:", records.length)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const updates = records.map(async (record: any) => {
      const { id } = record

      // Only include editable columns that exist in the inventarios table
      const updateData: any = {}

      if (record.aprobado !== undefined) updateData.aprobado = record.aprobado
      if (record.picking !== undefined) updateData.picking = record.picking
      if (record.proceso !== undefined) updateData.proceso = record.proceso
      if (record.loteproceso !== undefined) updateData.loteproceso = record.loteproceso
      if (record.enprograma !== undefined) updateData.enprograma = record.enprograma
      if (record.loteprograma !== undefined) updateData.loteprograma = record.loteprograma
      if (record.cuarentaa !== undefined) updateData.cuarentaa = record.cuarentaa
      if (record.lotecuarentaa !== undefined) updateData.lotecuarentaa = record.lotecuarentaa
      if (record.total !== undefined) updateData.total = record.total
      if (record.ventadehoy !== undefined) updateData.ventadehoy = record.ventadehoy
      if (record.inventario !== undefined) updateData.inventario = record.inventario
      if (record.ventamensual !== undefined) updateData.ventamensual = record.ventamensual
      if (record.porcentajemes !== undefined) updateData.porcentajemes = record.porcentajemes
      if (record.observaciones !== undefined) updateData.observaciones = record.observaciones

      console.log("[v0] Actualizando registro ID:", id, "con datos:", updateData)

      const { error } = await supabase.from("inventarios").update(updateData).eq("id", id)

      if (error) {
        console.error("[v0] Error al actualizar registro", id, ":", error)
        throw error
      }

      return { success: true, id }
    })

    await Promise.all(updates)

    console.log("[v0] Todos los registros actualizados exitosamente")

    return {
      success: true,
      data: { updated: records.length },
    }
  } catch (error) {
    console.error("[v0] Error en actualizarInventarios:", error)
    return {
      success: false,
      error: `Error al actualizar inventarios: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
