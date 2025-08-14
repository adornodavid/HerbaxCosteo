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
    - obtenerDetalleIngrediente / selDetalleIngrediente
    - obtenerFormulasQueUsanIngrediente / selFormulasXIngrediente
    - obtenerProductosRelacionadosIngrediente / selProductosXIngrediente
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

//Función: obtenerDetalleIngrediente: función para obtener información detallada del ingrediente
export async function obtenerDetalleIngrediente(ingredienteId: number) {
  try {
    // Get ingredient with related data
    const { data: ingredienteData, error: ingredienteError } = await supabase
      .from("ingredientes")
      .select(`
        id,
        codigo,
        nombre,
        costo,
        activo,
        clienteid,
        categoriaid,
        unidadmedidaid
      `)
      .eq("id", ingredienteId)
      .single()

    if (ingredienteError) {
      console.error("Error obteniendo ingrediente:", ingredienteError)
      return { data: null, error: ingredienteError.message }
    }

    // Get categoria info
    const { data: categoriaData, error: categoriaError } = await supabase
      .from("categoriasingredientes")
      .select("descripcion")
      .eq("id", ingredienteData.categoriaid)
      .single()

    // Get unidad medida info
    const { data: unidadData, error: unidadError } = await supabase
      .from("tipounidadesmedida")
      .select("descripcion")
      .eq("id", ingredienteData.unidadmedidaid)
      .single()

    // Get cliente info
    const { data: clienteData, error: clienteError } = await supabase
      .from("clientes")
      .select("nombre")
      .eq("id", ingredienteData.clienteid)
      .single()

    // Get catalogo info
    const { data: catalogoData, error: catalogoError } = await supabase
      .from("catalogos")
      .select("nombre")
      .eq("clienteid", ingredienteData.clienteid)
      .single()

    // Transform data to match expected structure
    const detalleIngrediente = {
      Folio: ingredienteData.id,
      codigo: ingredienteData.codigo,
      nombre: ingredienteData.nombre,
      Cliente: clienteData?.nombre || "N/A",
      Catalogo: catalogoData?.nombre || "N/A",
      categoria: categoriaData?.descripcion || "N/A",
      UnidadMedida: unidadData?.descripcion || "N/A",
      costo: ingredienteData.costo,
      activo: ingredienteData.activo,
      categoriaid: ingredienteData.categoriaid,
    }

    return { data: detalleIngrediente, error: null }
  } catch (error: any) {
    console.error("Error en obtenerDetalleIngrediente:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerFormulasQueUsanIngrediente: función para obtener fórmulas que usan este ingrediente
export async function obtenerFormulasQueUsanIngrediente(ingredienteId: number) {
  try {
    // Get ingredientesxformula records for this ingredient
    const { data: ingredientesFormulasData, error: ingredientesFormulasError } = await supabase
      .from("ingredientesxformula")
      .select("formulaid, cantidad, ingredientecostoparcial")
      .eq("ingredienteid", ingredienteId)

    if (ingredientesFormulasError) {
      console.error("Error obteniendo ingredientes x formula:", ingredientesFormulasError)
      return { data: null, error: ingredientesFormulasError.message }
    }

    if (!ingredientesFormulasData || ingredientesFormulasData.length === 0) {
      return { data: [], error: null }
    }

    // Get formula IDs
    const formulaIds = ingredientesFormulasData.map((item) => item.formulaid)

    // Get formulas info
    const { data: formulasData, error: formulasError } = await supabase
      .from("formulas")
      .select("id, nombre, imgurl")
      .in("id", formulaIds)

    if (formulasError) {
      console.error("Error obteniendo fórmulas:", formulasError)
      return { data: null, error: formulasError.message }
    }

    // Combine data
    const formulasConIngrediente = ingredientesFormulasData.map((item) => {
      const formula = formulasData?.find((f) => f.id === item.formulaid)
      return {
        imgurl: formula?.imgurl || null,
        Formula: formula?.nombre || "N/A",
        cantidad: item.cantidad,
        ingredientecostoparcial: item.ingredientecostoparcial,
      }
    })

    return { data: formulasConIngrediente, error: null }
  } catch (error: any) {
    console.error("Error en obtenerFormulasQueUsanIngrediente:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerProductosRelacionadosIngrediente: función para obtener productos relacionados a este ingrediente
export async function obtenerProductosRelacionadosIngrediente(ingredienteId: number, categoriaId: number) {
  try {
    let productosData = []

    if (categoriaId !== 3) {
      // Query for categoriaid <> 3
      // First get ingredientesxformula
      const { data: ingredientesFormulasData, error: ingredientesFormulasError } = await supabase
        .from("ingredientesxformula")
        .select("formulaid")
        .eq("ingredienteid", ingredienteId)

      if (ingredientesFormulasError) {
        console.error("Error obteniendo ingredientes x formula:", ingredientesFormulasError)
        return { data: null, error: ingredientesFormulasError.message }
      }

      if (!ingredientesFormulasData || ingredientesFormulasData.length === 0) {
        return { data: [], error: null }
      }

      const formulaIds = ingredientesFormulasData.map((item) => item.formulaid)

      // Get productosdetalles for these formulas
      const { data: productosDetallesData, error: productosDetallesError } = await supabase
        .from("productosdetalles")
        .select("productoid, cantidad, costoparcial")
        .in("elementoid", formulaIds)
        .eq("tiposegmentoid", 1)

      if (productosDetallesError) {
        console.error("Error obteniendo productos detalles:", productosDetallesError)
        return { data: null, error: productosDetallesError.message }
      }

      if (!productosDetallesData || productosDetallesData.length === 0) {
        return { data: [], error: null }
      }

      const productoIds = productosDetallesData.map((item) => item.productoid)

      // Get productos info
      const { data: productosInfo, error: productosError } = await supabase
        .from("productos")
        .select("id, nombre, imgurl")
        .in("id", productoIds)

      if (productosError) {
        console.error("Error obteniendo productos:", productosError)
        return { data: null, error: productosError.message }
      }

      // Combine data
      productosData = productosDetallesData.map((item) => {
        const producto = productosInfo?.find((p) => p.id === item.productoid)
        return {
          imgurl: producto?.imgurl || null,
          Producto: producto?.nombre || "N/A",
          cantidad: item.cantidad,
          costoparcial: item.costoparcial,
        }
      })
    } else {
      // Query for categoriaid = 3
      // Get productosdetalles directly
      const { data: productosDetallesData, error: productosDetallesError } = await supabase
        .from("productosdetalles")
        .select("productoid, cantidad, costoparcial")
        .eq("elementoid", ingredienteId)
        .eq("tiposegmentoid", 2)

      if (productosDetallesError) {
        console.error("Error obteniendo productos detalles:", productosDetallesError)
        return { data: null, error: productosDetallesError.message }
      }

      if (!productosDetallesData || productosDetallesData.length === 0) {
        return { data: [], error: null }
      }

      const productoIds = productosDetallesData.map((item) => item.productoid)

      // Get productos info
      const { data: productosInfo, error: productosError } = await supabase
        .from("productos")
        .select("id, nombre, imgurl, clienteid")
        .in("id", productoIds)

      if (productosError) {
        console.error("Error obteniendo productos:", productosError)
        return { data: null, error: productosError.message }
      }

      // Get unique client IDs
      const clienteIds = [...new Set(productosInfo?.map((p) => p.clienteid) || [])]

      // Get clientes info
      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes")
        .select("id, nombre")
        .in("id", clienteIds)

      if (clientesError) {
        console.error("Error obteniendo clientes:", clientesError)
        return { data: null, error: clientesError.message }
      }

      // Combine data
      productosData = productosDetallesData.map((item) => {
        const producto = productosInfo?.find((p) => p.id === item.productoid)
        const cliente = clientesData?.find((c) => c.id === producto?.clienteid)
        return {
          imgurl: producto?.imgurl || null,
          Producto: producto?.nombre || "N/A",
          Cliente: cliente?.nombre || "N/A",
          cantidad: item.cantidad,
          costoparcial: item.costoparcial,
        }
      })
    }

    return { data: productosData, error: null }
  } catch (error: any) {
    console.error("Error en obtenerProductosRelacionadosIngrediente:", error)
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
