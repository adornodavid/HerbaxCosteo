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

export const RolesAdmin = [1, 2, 3, 4]

export interface ConfiguracionXCliente {
  id: number
  clienteid: number
  zonaid: number
  descripcion: string
  valor: string
  activo: boolean
}

export async function obtenerConfiguracionesXCliente(
  clienteId: number,
  zonaId: number,
): Promise<{ success: boolean; data?: ConfiguracionXCliente[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("configuracionesxcliente")
      .select("*")
      .eq("clienteid", clienteId)
      .eq("zonaid", zonaId)
      .order("id", { ascending: true })

    if (error) {
      console.error("Error al obtener configuraciones:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en obtenerConfiguracionesXCliente:", error)
    return { success: false, error: "Error al obtener configuraciones" }
  }
}

export async function actualizarConfiguracion(
  id: number,
  valor: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("configuracionesxcliente").update({ valor }).eq("id", id)

    if (error) {
      console.error("Error al actualizar configuración:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error en actualizarConfiguracion:", error)
    return { success: false, error: "Error al actualizar configuración" }
  }
}
