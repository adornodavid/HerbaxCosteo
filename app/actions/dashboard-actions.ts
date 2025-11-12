"use server"

/* ==================================================
  Imports
================================================== */
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

/* ==================================================
  Funciones
  --------------------
	* INSERTS
		- insXXXXX
	* SELECTS
		- selXXXXX
	* UPDATES
		- updXXXXX
	* DELETES
		- delXXXXX
	* SPECIALS
		- xxxXXXXX
================================================== */
//Función: obtenerResumenesDashboard
export async function obtenerResumenesDashboard() {
  try {
    // const supabase = createSupabaseServerClient()

    // // Obtener conteo de hoteles activos
    // const { count: hotelesCount, error: hotelesError } = await supabase
    //   .from("hoteles")
    //   .select("*", { count: "exact", head: true })
    //   .eq("activo", true)

    // if (hotelesError) {
    //   console.error("Error obteniendo hoteles:", hotelesError)
    // }

    // // Obtener conteo de restaurantes activos
    // const { count: restaurantesCount, error: restaurantesError } = await supabase
    //   .from("restaurantes")
    //   .select("*", { count: "exact", head: true })
    //   .eq("activo", true)

    // if (restaurantesError) {
    //   console.error("Error obteniendo restaurantes:", restaurantesError)
    // }

    // // Obtener conteo de menús activos
    // const { count: menusCount, error: menusError } = await supabase
    //   .from("menus_restaurantes")
    //   .select("*", { count: "exact", head: true })
    //   .eq("activo", true)

    // if (menusError) {
    //   console.error("Error obteniendo menús:", menusError)
    // }

    // // Obtener conteo de platillos activos
    // const { count: platillosCount, error: platillosError } = await supabase
    //   .from("platillos")
    //   .select("*", { count: "exact", head: true })
    //   .eq("activo", true)

    // if (platillosError) {
    //   console.error("Error obteniendo platillos:", platillosError)
    // }

    // // Obtener conteo de ingredientes activos
    // const { count: ingredientesCount, error: ingredientesError } = await supabase
    //   .from("ingredientes")
    //   .select("*", { count: "exact", head: true })
    //   .eq("activo", true)

    // if (ingredientesError) {
    //   console.error("Error obteniendo ingredientes:", ingredientesError)
    // }

    return {
      success: true,
      data: {
        hoteles: 0,
        restaurantes: 0,
        menus: 0,
        platillos: 0,
        ingredientes: 0,
      },
    }
  } catch (error) {
    console.error("Error en obtenerResumenesDashboard:", error)
    return {
      success: false,
      error: "Error al obtener resúmenes del dashboard",
      data: {
        hoteles: 0,
        restaurantes: 0,
        menus: 0,
        platillos: 0,
        ingredientes: 0,
      },
    }
  }
}

export async function obtenerEstadisticasEmpresariales() {
  try {
    const supabase = createSupabaseServerClient()

    // Obtener estadísticas de productos por cliente
    const { data: productosPorCliente, error: productosError } = await supabase
      .from("productos")
      .select(`
        clienteid,
        activo
      `)
      .eq("activo", true)

    // // Obtener estadísticas de fórmulas por cliente
    // const { data: formulasPorCliente, error: formulasError } = await supabase
    //   .from("formulas")
    //   .select(`
    //     clienteid,
    //     clientes!inner(nombre),
    //     activo
    //   `)
    //   .eq("activo", true)

    // // Obtener estadísticas de ingredientes por categoría
    // const { data: ingredientesPorCategoria, error: ingredientesError } = await supabase
    //   .from("ingredientes")
    //   .select(`
    //     categoriaid,
    //     categoriasingredientes!inner(descripcion),
    //     activo
    //   `)
    //   .eq("activo", true)

    // Obtener costos promedio por tipo
    const { data: costosProductos, error: costosError } = await supabase
      .from("productos")
      .select("costo")
      .eq("activo", true)

    const { data: costosFormulas, error: costosFormulasError } = await supabase
      .from("formulas")
      .select("costo")
      .eq("activo", true)

    // const { data: costosIngredientes, error: costosIngredientesError } = await supabase
    //   .from("ingredientes")
    //   .select("costo")
    //   .eq("activo", true)

    // Procesar datos para gráficos
    const productosAgrupados =
      productosPorCliente?.reduce((acc: any, item: any) => {
        const clienteId = item.clienteid || 0
        acc[clienteId] = (acc[clienteId] || 0) + 1
        return acc
      }, {}) || {}

    // const formulasAgrupadas =
    //   formulasPorCliente?.reduce((acc: any, item: any) => {
    //     const clienteNombre = item.clientes?.nombre || "Sin cliente"
    //     acc[clienteNombre] = (acc[clienteNombre] || 0) + 1
    //     return acc
    //   }, {}) || {}

    // const ingredientesAgrupados =
    //   ingredientesPorCategoria?.reduce((acc: any, item: any) => {
    //     const categoriaNombre = item.categoriasingredientes?.descripcion || "Sin categoría"
    //     acc[categoriaNombre] = (acc[categoriaNombre] || 0) + 1
    //     return acc
    //   }, {}) || {}

    // Calcular promedios de costos
    const promedioCostoProductos = costosProductos?.length
      ? costosProductos.reduce((sum, item) => sum + (item.costo || 0), 0) / costosProductos.length
      : 0

    const promedioCostoFormulas = costosFormulas?.length
      ? costosFormulas.reduce((sum, item) => sum + (item.costo || 0), 0) / costosFormulas.length
      : 0

    const promedioCostoIngredientes = 0

    return {
      success: true,
      data: {
        productosPorCliente: Object.entries(productosAgrupados).map(([clienteId, cantidad]) => ({
          cliente: `Cliente ${clienteId}`,
          cantidad: cantidad as number,
        })),
        formulasPorCliente: [],
        ingredientesPorCategoria: [],
        promediosCostos: {
          productos: promedioCostoProductos,
          formulas: promedioCostoFormulas,
          ingredientes: promedioCostoIngredientes,
        },
      },
    }
  } catch (error) {
    console.error("Error en obtenerEstadisticasEmpresariales:", error)
    return {
      success: false,
      error: "Error al obtener estadísticas empresariales",
      data: {
        productosPorCliente: [],
        formulasPorCliente: [],
        ingredientesPorCategoria: [],
        promediosCostos: { productos: 0, formulas: 0, ingredientes: 0 },
      },
    }
  }
}

export async function obtenerKPIsDashboard() {
  try {
    const supabase = createSupabaseServerClient()

    // Total de clientes activos
    const { count: clientesActivos } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    // Total de catálogos activos
    const { count: catalogosActivos } = await supabase
      .from("catalogos")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    // Total de productos activos
    const { count: productosActivos } = await supabase
      .from("productos")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    // Total de fórmulas activas
    const { count: formulasActivas } = await supabase
      .from("formulas")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    // // Total de ingredientes activos
    // const { count: ingredientesActivos } = await supabase
    //   .from("ingredientes")
    //   .select("*", { count: "exact", head: true })
    //   .eq("activo", true)

    // Costo total del inventario
    const { data: costosProductos } = await supabase.from("productos").select("costo").eq("activo", true)

    const { data: costosFormulas } = await supabase.from("formulas").select("costo").eq("activo", true)

    // const { data: costosIngredientes } = await supabase.from("ingredientes").select("costo").eq("activo", true)

    const costoTotalProductos = costosProductos?.reduce((sum, item) => sum + (item.costo || 0), 0) || 0
    const costoTotalFormulas = costosFormulas?.reduce((sum, item) => sum + (item.costo || 0), 0) || 0
    const costoTotalIngredientes = 0

    return {
      success: true,
      data: {
        clientesActivos: clientesActivos || 0,
        catalogosActivos: catalogosActivos || 0,
        productosActivos: productosActivos || 0,
        formulasActivas: formulasActivas || 0,
        ingredientesActivos: 0,
        valorTotalInventario: costoTotalProductos + costoTotalFormulas + costoTotalIngredientes,
        costoTotalProductos,
        costoTotalFormulas,
        costoTotalIngredientes,
      },
    }
  } catch (error) {
    console.error("Error en obtenerKPIsDashboard:", error)
    return {
      success: false,
      error: "Error al obtener KPIs del dashboard",
      data: {
        clientesActivos: 0,
        catalogosActivos: 0,
        productosActivos: 0,
        formulasActivas: 0,
        ingredientesActivos: 0,
        valorTotalInventario: 0,
        costoTotalProductos: 0,
        costoTotalFormulas: 0,
        costoTotalIngredientes: 0,
      },
    }
  }
}

//Función: consultarUtilidadActual
export async function consultarUtilidadActual(clientesid: number, zonasid: number) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase.rpc("consultarutilidadactual", {
      clientesid: clientesid,
      zonasid: zonasid,
    })

    if (error) {
      console.error("Error consultando utilidad actual:", error)
      return {
        success: false,
        error: error.message,
        data: [],
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error("Error en consultarUtilidadActual:", error)
    return {
      success: false,
      error: "Error al consultar utilidad actual",
      data: [],
    }
  }
}
