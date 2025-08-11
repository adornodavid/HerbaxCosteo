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
  --------------------
	* CREATES-CREAR (INSERTS)
    - crearFormula / insFormula
  * READS-OBTENER (SELECTS)
    - obtenerFormulas / selFormulas
    - obtenerFormulasPorFiltros / selFormulasXFiltros
    - obtenerFormulaPorId / selFormulaXId
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarFormula / updFormula
  * DELETES-ELIMINAR (DELETES)
    - eliminarFormula / delFormula
  * SPECIALS-ESPECIALES ()
    - estatusActivoFormula / actFormula
    - listaDesplegableFormulas / ddlFormulas
    - estadisticasFormulasTotales / statsFormlasTotales
================================================== */
//Función: crearFormula: funcion para crear una formula

//Función: obtenerFormulas: funcion para obtener todas las formulas
export async function obtenerFormulas(page = 1, limit = 20) {
  const offset = (page - 1) * limit
  try {
    const {
      data: queryData,
      error: queryError,
      count,
    } = await supabase.rpc("get_formulas_with_details", {
      p_offset: offset,
      p_limit: limit,
    })

    // Alternative using raw SQL if RPC doesn't work
    const { data: rawData, error: rawError } = await supabase
      .from("formulas")
      .select(`
        id,
        nombre,
        notaspreparacion,
        costo,
        imgurl,
        activo,
        cantidad,
        unidadmedidaid,
        fechacreacion,
        ingredientesxformula!inner(
          ingredienteid,
          ingredientes!inner(
            clienteid,
            clientes!inner(
              nombre
            )
          )
        )
      `)
      .range(offset, offset + limit - 1)

    if (rawError) {
      console.error("Error al obtener formulas:", rawError)
      return { data: null, error: rawError.message, totalCount: 0 }
    }

    // Mapear los datos para que coincidan con el tipo esperado
    const mappedData =
      rawData?.map((formula) => ({
        Folio: formula.id,
        Nombre: formula.nombre,
        NotasPreparacion: formula.notaspreparacion,
        Costo: formula.costo,
        Imagen: formula.imgurl,
        Activo: formula.activo,
        Cantidad: formula.cantidad,
        UnidadMedidaId: formula.unidadmedidaid,
        FechaCreacion: formula.fechacreacion,
        IngredienteId: formula.ingredientesxformula?.[0]?.ingredienteid,
        ClienteId: formula.ingredientesxformula?.[0]?.ingredientes?.clienteid,
        Cliente: formula.ingredientesxformula?.[0]?.ingredientes?.clientes?.nombre || "N/A",
      })) || []

    return { data: mappedData, error: null, totalCount: rawData?.length || 0 }
  } catch (error: any) {
    console.error("Error en obtenerFormulas:", error)
    return { data: null, error: error.message, totalCount: 0 }
  }
}

//Función: obtenerFormulasPorFiltros: funcion para obtener todas las formulas por el filtrado
export async function obtenerFormulasPorFiltros(nombre = "", clienteId = "", activo = true, page = 1, limit = 20) {
  const offset = (page - 1) * limit
  try {
    let supabaseQuery = supabase
      .from("formulas")
      .select(`
        id,
        nombre,
        notaspreparacion,
        costo,
        imgurl,
        activo,
        cantidad,
        unidadmedidaid,
        fechacreacion,
        ingredientesxformula!inner(
          ingredienteid,
          ingredientes!inner(
            clienteid,
            clientes!inner(
              nombre
            )
          )
        )
      `)
      .range(offset, offset + limit - 1)
      .order("nombre", { ascending: true })

    // Solo aplicar filtro de nombre si tiene valor (no está vacío)
    if (nombre && nombre.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("nombre", `%${nombre}%`)
    }

    if (clienteId && clienteId !== 0) {
      supabaseQuery = supabaseQuery.eq("ingredientesxformula.ingredientes.clienteid", clienteId)
    }

    if (activo !== undefined) {
      supabaseQuery = supabaseQuery.eq("activo", activo)
    }

    const { data: queryData, error: queryError, count } = await supabaseQuery.range(offset, offset + limit - 1)

    if (queryError) {
      console.error("Error al obtener formulas:", queryError)
      return { data: null, error: queryError.message, totalCount: 0 }
    }

    // Mapear los datos para que coincidan con el tipo esperado
    const mappedData =
      queryData?.map((formula) => ({
        Folio: formula.id,
        Nombre: formula.nombre,
        NotasPreparacion: formula.notaspreparacion,
        Costo: formula.costo,
        Imagen: formula.imgurl,
        Activo: formula.activo,
        Cantidad: formula.cantidad,
        UnidadMedidaId: formula.unidadmedidaid,
        FechaCreacion: formula.fechacreacion,
        IngredienteId: formula.ingredientesxformula?.[0]?.ingredienteid,
        ClienteId: formula.ingredientesxformula?.[0]?.ingredientes?.clienteid,
        Cliente: formula.ingredientesxformula?.[0]?.ingredientes?.clientes?.nombre || "N/A",
      })) || []

    return { data: mappedData, error: null, totalCount: count || 0 }
  } catch (error: any) {
    console.error("Error en obtenerFormulasPorFiltros:", error)
    return { data: null, error: error.message, totalCount: 0 }
  }
}

//Función: obtenerFormulaPorId: funcion para obtener la formula por Id de la formula

//Función: actualizarFormula: funcion para actualizar la información de una formula por Id de la formula

//Función: eliminarFormula: funcion para eliminar la información de una formula por Id de la formula

// Función: estatusActivoFormula: función para cambiar el estatus de una formula por Id de la formula
export async function estatusActivoFormula(folio: number, estadoActual: boolean) {
  try {
    const nuevoEstado = !estadoActual

    const { data, error } = await supabase.from("formulas").update({ activo: nuevoEstado }).eq("id", folio).select()

    if (error) {
      console.error("Error al cambiar estado de fórmula:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data[0],
      nuevoEstado,
      message: `Fórmula ${nuevoEstado ? "activada" : "inactivada"} correctamente`,
    }
  } catch (error: any) {
    console.error("Error en estatusActivoFormula:", error)
    return { success: false, error: error.message }
  }
}

//Función: listaDesplegableFormulas: funcion para obtener todas las formulas para el input dropdownlist

//Función: estadisticasFormulasTotales: Función estadística para conocer el total de formulas registradas en la base de datos
export async function estatusActivoFormula(folio: number, estadoActual: boolean) {

}
