"use server"

export async function obtenerCotizaciones(nombre: string, clienteId: number, estatus: string) {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")

    let query = supabase.from("vw_listadocotizaciones").select("*")

    // Agregar filtros dinámicos
    if (nombre && nombre.trim() !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }

    if (clienteId && clienteId !== -1) {
      query = query.eq("clienteid", clienteId)
    }

    if (estatus && estatus !== "Todos") {
      query = query.eq("estatus", estatus)
    }

    const { data, error } = await query

    console.log("[v0] obtenerCotizaciones - Nombre:", nombre, "ClienteId:", clienteId, "Estatus:", estatus)
    console.log("[v0] obtenerCotizaciones - Total registros encontrados:", data?.length || 0, "Error:", error?.message)

    if (error) {
      console.error("Error obteniendo cotizaciones:", error)
      return { success: false, data: [], error: error.message }
    }

    // Log de los primeros registros para verificar zonaid
    if (data && data.length > 0) {
      console.log("[v0] Primeros 3 registros:", data.slice(0, 3).map(c => ({ id: c.id, titulo: c.titulo, zonaid: c.zonaid })))
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en obtenerCotizaciones:", error)
    return { success: false, data: [], error: String(error) }
  }
}
