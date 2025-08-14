/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabase = createClient()

/* ==================================================
  Funciones
  --------------------
	* CREATES-CREAR (INSERTS)
    - crearIngrediente / insIngrediente
  * READS-OBTENER (SELECTS)
    - obtenerIngredientes / selIngredientes
    - obtenerIngredientesPorFiltros / selIngredientesXFiltros
    - obtenerIngredientePorId / selIngredienteXId
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarIngrediente / updIngrediente
  * DELETES-ELIMINAR (DELETES)
    - eliminarIngrediente / delIngrediente
  * SPECIALS-ESPECIALES ()
    - estatusActivoIngrediente / actIngrediente
    - listaDesplegableIngredientes / ddlIngredientes
================================================== */

//Función: crearIngrediente: funcion para crear un ingrediente
export async function crearIngrediente(ingredienteData: any) {
  try {
    const { data, error } = await supabase.from("ingredientes").insert(ingredienteData).select()

    if (error) {
      console.error("Error creando ingrediente:", error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, error: null, data }
  } catch (error: any) {
    console.error("Error en crearIngrediente:", error)
    return { success: false, error: error.message, data: null }
  }
}

//Función: obtenerIngredientes: funcion para obtener todos los ingredientes
export async function obtenerIngredientes(rolId: number, clienteId = -1) {
  try {
    // First get ingredientes with basic info
    let ingredientesQuery = supabase.from("ingredientes").select(`
      id,
      codigo,
      nombre,
      costo,
      activo,
      clienteid,
      categoriaid,
      unidadmedidaid,
      categoriasingredientes!inner(descripcion),
      tipounidadesmedida!inner(descripcion)
    `)

    // Apply role-based filtering
    if (![1, 2, 3].includes(rolId) && clienteId > 0) {
      ingredientesQuery = ingredientesQuery.eq("clienteid", clienteId)
    }

    const { data: ingredientesData, error: ingredientesError } = await ingredientesQuery

    if (ingredientesError) {
      console.error("Error obteniendo ingredientes:", ingredientesError)
      return { data: null, error: ingredientesError.message }
    }

    if (!ingredientesData || ingredientesData.length === 0) {
      return { data: [], error: null }
    }

    // Get unique client IDs to fetch client and catalog info
    const clienteIds = [...new Set(ingredientesData.map((item) => item.clienteid))]

    // Get clients info
    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nombre")
      .in("id", clienteIds)

    if (clientesError) {
      console.error("Error obteniendo clientes:", clientesError)
      return { data: null, error: clientesError.message }
    }

    // Get catalogs info
    const { data: catalogosData, error: catalogosError } = await supabase
      .from("catalogos")
      .select("id, nombre, clienteid")
      .in("clienteid", clienteIds)

    if (catalogosError) {
      console.error("Error obteniendo catálogos:", catalogosError)
      return { data: null, error: catalogosError.message }
    }

    // Transform data to match expected structure
    const transformedData = ingredientesData.map((ingrediente: any) => {
      const cliente = clientesData?.find((c) => c.id === ingrediente.clienteid)
      const catalogo = catalogosData?.find((cat) => cat.clienteid === ingrediente.clienteid)

      return {
        Folio: ingrediente.id,
        codigo: ingrediente.codigo,
        nombre: ingrediente.nombre,
        Cliente: cliente?.nombre || "N/A",
        Catalogo: catalogo?.nombre || "N/A",
        categoria: ingrediente.categoriasingredientes?.descripcion || "N/A",
        UnidadMedida: ingrediente.tipounidadesmedida?.descripcion || "N/A",
        costo: ingrediente.costo,
        activo: ingrediente.activo,
      }
    })

    return { data: transformedData, error: null }
  } catch (error: any) {
    console.error("Error en obtenerIngredientes:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerIngredientesPorFiltros: funcion para obtener todos los ingredientes por el filtrado
export async function obtenerIngredientesPorFiltros(nombre = "", clienteId = -1, estatus = true) {
  try {
    let query = supabase.from("ingredientes").select(`
      id,
      codigo,
      nombre,
      costo,
      activo,
      clienteid,
      categoriaid,
      unidadmedidaid,
      categoriasingredientes!inner(descripcion),
      tipounidadesmedida!inner(descripcion)
    `)

    // Apply filters conditionally
    if (nombre && nombre.trim() !== "") {
      query = query.ilike("nombre", `%${nombre.trim()}%`)
    }

    if (clienteId > 0) {
      query = query.eq("clienteid", clienteId)
    }

    query = query.eq("activo", estatus).order("nombre")

    const { data: ingredientesData, error: ingredientesError } = await query

    if (ingredientesError) {
      console.error("Error obteniendo ingredientes por filtros:", ingredientesError)
      return { data: null, error: ingredientesError.message }
    }

    if (!ingredientesData || ingredientesData.length === 0) {
      return { data: [], error: null }
    }

    // Get unique client IDs to fetch client and catalog info
    const clienteIds = [...new Set(ingredientesData.map((item) => item.clienteid))]

    // Get clients info
    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nombre")
      .in("id", clienteIds)

    if (clientesError) {
      console.error("Error obteniendo clientes:", clientesError)
      return { data: null, error: clientesError.message }
    }

    // Get catalogs info
    const { data: catalogosData, error: catalogosError } = await supabase
      .from("catalogos")
      .select("id, nombre, clienteid")
      .in("clienteid", clienteIds)

    if (catalogosError) {
      console.error("Error obteniendo catálogos:", catalogosError)
      return { data: null, error: catalogosError.message }
    }

    // Transform data to match expected structure
    const transformedData = ingredientesData.map((ingrediente: any) => {
      const cliente = clientesData?.find((c) => c.id === ingrediente.clienteid)
      const catalogo = catalogosData?.find((cat) => cat.clienteid === ingrediente.clienteid)

      return {
        Folio: ingrediente.id,
        codigo: ingrediente.codigo,
        nombre: ingrediente.nombre,
        Cliente: cliente?.nombre || "N/A",
        Catalogo: catalogo?.nombre || "N/A",
        categoria: ingrediente.categoriasingredientes?.descripcion || "N/A",
        UnidadMedida: ingrediente.tipounidadesmedida?.descripcion || "N/A",
        costo: ingrediente.costo,
        activo: ingrediente.activo,
      }
    })

    return { data: transformedData, error: null }
  } catch (error: any) {
    console.error("Error en obtenerIngredientesPorFiltros:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerIngredientePorId: funcion para obtener el ingrediente por Id del ingrediente
export async function obtenerIngredientePorId(ingredienteId: number) {
  try {
    const { data, error } = await supabase.from("ingredientes").select("*").eq("id", ingredienteId).single()

    if (error) {
      console.error("Error obteniendo ingrediente por ID:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerIngredientePorId:", error)
    return { data: null, error: error.message }
  }
}

//Función: actualizarIngrediente: funcion para actualizar la información de un ingrediente por Id del ingrediente
export async function actualizarIngrediente(ingredienteId: number, ingredienteData: any) {
  try {
    const { data, error } = await supabase.from("ingredientes").update(ingredienteData).eq("id", ingredienteId).select()

    if (error) {
      console.error("Error actualizando ingrediente:", error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, error: null, data }
  } catch (error: any) {
    console.error("Error en actualizarIngrediente:", error)
    return { success: false, error: error.message, data: null }
  }
}

//Función: eliminarIngrediente: funcion para eliminar la información de un ingrediente por Id del ingrediente
export async function eliminarIngrediente(ingredienteId: number) {
  try {
    const { error } = await supabase.from("ingredientes").delete().eq("id", ingredienteId)

    if (error) {
      console.error("Error eliminando ingrediente:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error en eliminarIngrediente:", error)
    return { success: false, error: error.message }
  }
}

// Función: estatusActivoIngrediente: función para cambiar el estatus de un ingrediente por Id del ingrediente
export async function estatusActivoIngrediente(ingredienteId: number, estadoActual: boolean) {
  try {
    const nuevoEstado = !estadoActual

    const { error } = await supabase.from("ingredientes").update({ activo: nuevoEstado }).eq("id", ingredienteId)

    if (error) {
      console.error("Error cambiando estatus del ingrediente:", error)
      return { success: false, error: error.message, nuevoEstado: estadoActual }
    }

    return { success: true, error: null, nuevoEstado }
  } catch (error: any) {
    console.error("Error en estatusActivoIngrediente:", error)
    return { success: false, error: error.message, nuevoEstado: estadoActual }
  }
}

//Función: estadisticasIngredientesTotales: función para obtener estadísticas totales de ingredientes
export async function estadisticasIngredientesTotales() {
  try {
    const { count, error } = await supabase.from("ingredientes").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error obteniendo estadísticas de ingredientes:", error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error: any) {
    console.error("Error en estadisticasIngredientesTotales:", error)
    return { count: 0, error: error.message }
  }
}

//Función: listaDesplegableIngredientes: funcion para obtener todos los ingredientes para el input dropdownlist
export async function listaDesplegableIngredientes(clienteId = "-1", nombre = "") {
  try {
    let query = supabase.from("ingredientes").select("id, nombre").eq("activo", true)

    if (clienteId !== "-1" && clienteId !== "") {
      query = query.eq("clienteid", clienteId)
    }

    if (nombre && nombre.trim() !== "") {
      query = query.ilike("nombre", `%${nombre.trim()}%`)
    }

    const { data, error } = await query.order("nombre")

    if (error) {
      console.error("Error obteniendo lista desplegable de ingredientes:", error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    console.error("Error en listaDesplegableIngredientes:", error)
    return { data: null, error: error.message }
  }
}
