/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */

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
  const supabase = createClient()

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
  const supabase = createClient()

  try {
    let query: string

    if ([1, 2, 3].includes(rolId)) {
      // Para roles 1, 2, 3 - mostrar todos los ingredientes
      query = `
        select 
          a.id as Folio,
          a.codigo, 
          a.nombre, 
          e.nombre as Cliente, 
          d.nombre as Catalogo, 
          b.descripcion as categoria, 
          c.descripcion as UnidadMedida,
          a.costo, 
          a.activo 
        from ingredientes a
        inner join categoriasingredientes b on a.categoriaid = b.id
        inner join tipounidadesmedida c on a.unidadmedidaid = c.id
        inner join catalogos d on a.clienteid = d.clienteid
        inner join clientes e on a.clienteid = e.id
        where (e.id = -1 or -1 = -1) and (d.id = -1 or -1 = -1)
      `
    } else {
      // Para otros roles - filtrar por cliente específico
      query = `
        select 
          a.id as Folio,
          a.codigo, 
          a.nombre, 
          e.nombre as Cliente, 
          d.nombre as Catalogo, 
          b.descripcion as categoria, 
          c.descripcion as UnidadMedida,
          a.costo, 
          a.activo 
        from ingredientes a
        inner join categoriasingredientes b on a.categoriaid = b.id
        inner join tipounidadesmedida c on a.unidadmedidaid = c.id
        inner join catalogos d on a.clienteid = d.clienteid
        inner join clientes e on a.clienteid = e.id
        where e.id = ${clienteId} and d.id = ${clienteId}
      `
    }

    const { data, error } = await supabase.rpc("execute_sql", { query })

    if (error) {
      console.error("Error obteniendo ingredientes:", error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    console.error("Error en obtenerIngredientes:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerIngredientesPorFiltros: funcion para obtener todos los ingredientes por el filtrado
export async function obtenerIngredientesPorFiltros(nombre = "", clienteId = -1, estatus = true) {
  const supabase = createClient()

  try {
    const whereConditions = []

    // Filtro por nombre
    if (nombre && nombre.trim() !== "") {
      whereConditions.push(`a.nombre ILIKE '%${nombre.trim()}%'`)
    }

    // Filtro por cliente
    if (clienteId > 0) {
      whereConditions.push(`e.id = ${clienteId}`)
    } else {
      whereConditions.push(`(e.id = ${clienteId} or ${clienteId} = -1)`)
    }

    // Filtro por catálogo (usando el mismo clienteId)
    if (clienteId > 0) {
      whereConditions.push(`d.id = ${clienteId}`)
    } else {
      whereConditions.push(`(d.id = ${clienteId} or ${clienteId} = -1)`)
    }

    // Filtro por estatus
    whereConditions.push(`a.activo = ${estatus}`)

    const whereClause = whereConditions.length > 0 ? `where ${whereConditions.join(" and ")}` : ""

    const query = `
      select 
        a.id as Folio,
        a.codigo, 
        a.nombre, 
        e.nombre as Cliente, 
        d.nombre as Catalogo, 
        b.descripcion as categoria, 
        c.descripcion as UnidadMedida,
        a.costo, 
        a.activo 
      from ingredientes a
      inner join categoriasingredientes b on a.categoriaid = b.id
      inner join tipounidadesmedida c on a.unidadmedidaid = c.id
      inner join catalogos d on a.clienteid = d.clienteid
      inner join clientes e on a.clienteid = e.id
      ${whereClause}
      order by a.nombre
    `

    const { data, error } = await supabase.rpc("execute_sql", { query })

    if (error) {
      console.error("Error obteniendo ingredientes por filtros:", error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    console.error("Error en obtenerIngredientesPorFiltros:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerIngredientePorId: funcion para obtener el ingrediente por Id del ingrediente
export async function obtenerIngredientePorId(ingredienteId: number) {
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

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
