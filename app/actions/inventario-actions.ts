"use server"

import { createClient } from "@/lib/supabase"

const supabaseAdmin = createClient()

// Función para obtener estadísticas generales del inventario
export async function obtenerEstadisticasInventario() {
  try {
    // Obtener total de productos activos
    const { data: productosActivos, error: errorActivos } = await supabaseAdmin
      .from("productos")
      .select("id")
      .eq("activo", true)

    // Obtener valor total del inventario
    const { data: valorInventario, error: errorValor } = await supabaseAdmin
      .from("productos")
      .select("costo")
      .eq("activo", true)

    // Obtener productos por categoría de uso
    const { data: productosPorCategoria, error: errorCategoria } = await supabaseAdmin
      .from("productos")
      .select("categoriauso, id")
      .eq("activo", true)

    if (errorActivos || errorValor || errorCategoria) {
      console.error("Error obteniendo estadísticas:", errorActivos || errorValor || errorCategoria)
      return { success: false, error: "Error obteniendo estadísticas" }
    }

    // Calcular estadísticas
    const totalProductos = productosActivos?.length || 0
    const valorTotal = valorInventario?.reduce((sum, item) => sum + (item.costo || 0), 0) || 0

    // Simular estados de inventario basados en datos existentes
    const enStock = Math.floor(totalProductos * 0.7) // 70% en stock
    const proximosVencer = Math.floor(totalProductos * 0.15) // 15% próximos a vencer
    const enRevision = Math.floor(totalProductos * 0.1) // 10% en revisión
    const enProceso = Math.floor(totalProductos * 0.05) // 5% en proceso

    // Agrupar por categoría
    const categorias =
      productosPorCategoria?.reduce((acc: any, item) => {
        const categoria = item.categoriauso || "Sin categoría"
        acc[categoria] = (acc[categoria] || 0) + 1
        return acc
      }, {}) || {}

    return {
      success: true,
      data: {
        totalProductos,
        valorTotal,
        enStock,
        proximosVencer,
        enRevision,
        enProceso,
        categorias,
      },
    }
  } catch (error) {
    console.error("Error en obtenerEstadisticasInventario:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función para obtener listado detallado de productos en inventario
export async function obtenerInventarioDetallado() {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos")
      .select(`
        id, nombre, descripcion, presentacion, costo, imgurl, 
        categoriauso, propositoprincipal, vidaanaquelmeses,
        fechacreacion, activo
      `)
      .eq("activo", true)
      .order("fechacreacion", { ascending: false })

    if (error) {
      console.error("Error obteniendo inventario detallado:", error)
      return { success: false, error: error.message }
    }

    // Simular estados y cantidades para cada producto
    const inventarioConEstados =
      data?.map((producto) => {
        const estadosAleatorios = ["stock", "proximo_vencer", "revision", "proceso"]
        const cantidadBase = Math.floor(Math.random() * 100) + 10

        return {
          ...producto,
          cantidadStock: cantidadBase,
          cantidadProximaVencer: Math.floor(Math.random() * 20),
          cantidadEnRevision: Math.floor(Math.random() * 10),
          cantidadEnProceso: Math.floor(Math.random() * 15),
          estadoPrincipal: estadosAleatorios[Math.floor(Math.random() * estadosAleatorios.length)],
          diasParaVencer: Math.floor(Math.random() * 90) + 1,
          loteNumero: `LT-${Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, "0")}`,
          ubicacion: `A${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`,
        }
      }) || []

    return { success: true, data: inventarioConEstados }
  } catch (error) {
    console.error("Error en obtenerInventarioDetallado:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función para obtener productos con alertas críticas
export async function obtenerAlertasInventario() {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos")
      .select("id, nombre, imgurl, costo, vidaanaquelmeses")
      .eq("activo", true)
      .limit(10)

    if (error) {
      console.error("Error obteniendo alertas:", error)
      return { success: false, error: error.message }
    }

    // Simular alertas críticas
    const alertas =
      data?.map((producto) => ({
        ...producto,
        tipoAlerta: Math.random() > 0.5 ? "stock_bajo" : "proximo_vencer",
        nivel: Math.random() > 0.7 ? "critico" : "advertencia",
        mensaje:
          Math.random() > 0.5
            ? `Stock bajo: ${Math.floor(Math.random() * 5) + 1} unidades restantes`
            : `Vence en ${Math.floor(Math.random() * 7) + 1} días`,
      })) || []

    return { success: true, data: alertas }
  } catch (error) {
    console.error("Error en obtenerAlertasInventario:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función para obtener movimientos recientes de inventario
export async function obtenerMovimientosRecientes() {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos")
      .select("id, nombre, imgurl, fechacreacion")
      .eq("activo", true)
      .order("fechacreacion", { ascending: false })
      .limit(15)

    if (error) {
      console.error("Error obteniendo movimientos:", error)
      return { success: false, error: error.message }
    }

    // Simular movimientos de inventario
    const tiposMovimiento = ["entrada", "salida", "ajuste", "transferencia"]
    const movimientos =
      data?.map((producto) => ({
        id: Math.floor(Math.random() * 10000),
        productoId: producto.id,
        productoNombre: producto.nombre,
        productoImagen: producto.imgurl,
        tipo: tiposMovimiento[Math.floor(Math.random() * tiposMovimiento.length)],
        cantidad: Math.floor(Math.random() * 50) + 1,
        fecha: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        usuario: "Sistema",
        observaciones: "Movimiento automático del sistema",
      })) || []

    return { success: true, data: movimientos }
  } catch (error) {
    console.error("Error en obtenerMovimientosRecientes:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
