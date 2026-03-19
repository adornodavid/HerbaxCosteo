"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ConfiguracionFijo {
  id: number
  clienteid: number
  zonaid: number
  orden: number
  descripcion: string
  valor: number
  activo: boolean
  fechacreacion: string
}

export interface EscenarioCosto {
  id: number
  clienteid: number
  zonaid: number
  escenarioid: number
  rangominimo: number
  rangomaximo: number
  materiaprima: number
  materialenvase: number
  materialempaque: number
  margenseguridad: number
  mermamp: number
  mermamem: number
  mermame: number
  importaciones: number
  fletes: number
  manoobra: number
  maquinaria: number
  electricidad: number
  controlcalidad: number
  supervision: number
  administracion: number
  otros: number
}

export interface ConfiguracionXCliente {
  clienteid: number
  zonaid: number
  descripcion: string
  valor: number
  orden: number
  tipodato?: string
}

export interface PreciosProducto {
  clienteid: number
  productoid: number
  preciosiniva2025: number
  precioconiva2025: number
  preciosiniva2026: number
  precioconiva2026: number
  unidadesvendidas2025: number
}

export async function obtenerConfiguracionesFijo(
  clienteid: number,
  zonaid: number
): Promise<{ success: boolean; data?: ConfiguracionFijo[]; error?: string }> {
  try {
    console.log(
      "[v0] obtenerConfiguracionesFijo - clienteid:",
      clienteid,
      "zonaid:",
      zonaid
    )

    const { data, error } = await supabase
      .from("vw_configuracionesfijo")
      .select("*")
      .eq("clienteid", clienteid)
      .eq("zonaid", zonaid)
      .order("orden", { ascending: true })

    if (error) {
      console.error("[v0] Error en obtenerConfiguracionesFijo:", error)
      return { success: false, error: error.message }
    }

    console.log(
      "[v0] obtenerConfiguracionesFijo - datos obtenidos:",
      data?.length
    )

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Error en obtenerConfiguracionesFijo catch:", error)
    return { success: false, error: "Error al obtener configuraciones" }
  }
}

export interface ProductoValorOriginal {
  id: number
  clienteid: number
  zonaid: number
  materiaprima: number
  materialenvase: number
  materialempaque: number
  margenseguridad: number
  mermamp: number
  mermamem: number
  mermame: number
  importaciones: number
  fletes: number
  manoobra: number
  maquinaria: number
  electricidad: number
  controlcalidad: number
  supervision: number
  administracion: number
  otros: number
}

export async function obtenerEscenarioCostos(
  clienteid: number,
  zonaid: number
): Promise<{ success: boolean; data?: EscenarioCosto[]; error?: string }> {
  try {
    console.log(
      "[v0] obtenerEscenarioCostos - clienteid:",
      clienteid,
      "zonaid:",
      zonaid
    )

    const { data, error } = await supabase
      .from("escenariocostos")
      .select("*")
      .eq("clienteid", clienteid)
      .eq("zonaid", zonaid)
      .order("escenarioid", { ascending: true })

    if (error) {
      console.error("[v0] Error en obtenerEscenarioCostos:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] obtenerEscenarioCostos - datos obtenidos:", data?.length)

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Error en obtenerEscenarioCostos catch:", error)
    return { success: false, error: "Error al obtener escenarios de costos" }
  }
}

export async function obtenerProductoValorOriginal(
  productoid: number,
  clienteid: number,
  zonaid: number
): Promise<{ success: boolean; data?: ProductoValorOriginal; error?: string }> {
  try {
    console.log(
      "[v0] obtenerProductoValorOriginal - productoid:",
      productoid,
      "clienteid:",
      clienteid,
      "zonaid:",
      zonaid
    )

    const { data, error } = await supabase
      .from("vw_productosvalororiginal")
      .select("*")
      .eq("id", productoid)
      .eq("clienteid", clienteid)
      .eq("zonaid", zonaid)
      .single()

    if (error) {
      console.error("[v0] Error en obtenerProductoValorOriginal:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] obtenerProductoValorOriginal - datos obtenidos:", data)

    return { success: true, data: data || undefined }
  } catch (error) {
    console.error("[v0] Error en obtenerProductoValorOriginal catch:", error)
    return { success: false, error: "Error al obtener valores originales del producto" }
  }
}

export async function obtenerConfiguracionesXCliente(
  clienteid: number,
  zonaid: number
): Promise<{ success: boolean; data?: ConfiguracionXCliente[]; error?: string }> {
  try {
    console.log(
      "[v0] obtenerConfiguracionesXCliente - clienteid:",
      clienteid,
      "zonaid:",
      zonaid
    )

    const { data, error } = await supabase
      .from("configuracionesxcliente")
      .select("clienteid, zonaid, descripcion, valor, orden, tipodato")
      .eq("clienteid", clienteid)
      .eq("zonaid", zonaid)
      .in("orden", [10, 11, 12, 13, 14, 15, 16, 17, 18])
      .order("orden", { ascending: true })

    if (error) {
      console.error("[v0] Error en obtenerConfiguracionesXCliente:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] obtenerConfiguracionesXCliente - datos obtenidos:", data?.length)

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Error en obtenerConfiguracionesXCliente catch:", error)
    return { success: false, error: "Error al obtener configuraciones adicionales" }
  }
}

export async function obtenerPreciosProductos(
  clienteid: number,
  productoid: number
): Promise<{ success: boolean; data?: PreciosProducto; error?: string }> {
  try {
    console.log("[v0] obtenerPreciosProductos - clienteid:", clienteid, "productoid:", productoid)

    const { data, error } = await supabase
      .from("vw_preciosproductos")
      .select("*")
      .eq("clienteid", clienteid)
      .eq("productoid", productoid)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error en obtenerPreciosProductos:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] obtenerPreciosProductos - datos obtenidos:", data)

    return { success: true, data: data || undefined }
  } catch (error) {
    console.error("[v0] Error en obtenerPreciosProductos catch:", error)
    return { success: false, error: "Error al obtener precios del producto" }
  }
}

export interface ProductoCosteoInsert {
  clienteid: number
  productoid: number
  precioventasiniva: number
  precioventaconiva: number
  fechacreacion: string
  activo: boolean
  preciohl: number
  ivapagado: number
  cda: number
  reembolsos: number
  tarjetacredito: number
  envio: number
  totalcosto: number
  categoria: number
  forecast: number
  precioventaconivaaa: number
  fechamodificacion: string
  promocionescomerciales: number
  utilidad: number
  utilidadcosto: number
  totalutilidad: number
  mermamp: number
  mermamem: number
  mermame: number
  importaciones: number
  fletes: number
  manoobra: number
  maquinaria: number
  electricidad: number
  controlcalidad: number
  supervision: number
  administracion: number
  otros: number
}

export async function insertarProductoCosteo(
  data: ProductoCosteoInsert
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] insertarProductoCosteo - data:", data)

    // Primero verificar si existe un registro con ese clienteid y productoid
    const { data: existingData, error: selectError } = await supabase
      .from("productoscosteo")
      .select("*")
      .eq("clienteid", data.clienteid)
      .eq("productoid", data.productoid)

    if (selectError) {
      console.error("[v0] Error en SELECT productoscosteo:", selectError)
      return { success: false, error: selectError.message }
    }

    // Si existe data, primero hacer DELETE
    if (existingData && existingData.length > 0) {
      console.log("[v0] Registro existente encontrado, realizando DELETE...")
      const { error: deleteError } = await supabase
        .from("productoscosteo")
        .delete()
        .eq("clienteid", data.clienteid)
        .eq("productoid", data.productoid)

      if (deleteError) {
        console.error("[v0] Error en DELETE productoscosteo:", deleteError)
        return { success: false, error: deleteError.message }
      }
      console.log("[v0] DELETE exitoso")
    }

    // Ahora hacer el INSERT
    const { error: insertError } = await supabase
      .from("productoscosteo")
      .insert([data])

    if (insertError) {
      console.error("[v0] Error en INSERT productoscosteo:", insertError)
      return { success: false, error: insertError.message }
    }

    console.log("[v0] insertarProductoCosteo - insert exitoso")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error en insertarProductoCosteo catch:", error)
    return { success: false, error: "Error al insertar producto costeo" }
  }
}
