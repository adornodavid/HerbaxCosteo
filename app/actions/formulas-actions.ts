"use server"
/* ==================================================
  Imports
================================================== */
import { createClient } from '@/lib/supabase'

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
 export async function obtenerFormulas(page = 1, limit = 20){
  const offset = (page - 1) * limit
  try {
    let supabaseQuery = supabase
      .from("formulas") // Cambiado de 'hoteles' a 'clientes'
      .select("id, nombre, notaspreparacion, costo, imgurl, activo, cantidad, unidadmedidaid, fechacreacion", { count: "exact" })
      .order("nombre", { ascending: true })

    const { data: queryData, error: queryError, count } = await supabaseQuery.range(offset, offset + limit - 1)

    if (queryError) {
      console.error("Error al obtener formulas:", queryError)
      return { data: null, error: queryError.message, totalCount: 0 }
    }

    // Mapear los datos para que coincidan con el tipo ClienteResult
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
        Cliente: formula.cliente,
      })) || []

    return { data: mappedData, error: null, totalCount: count || 0 }
  } catch (error: any) {
    console.error("Error en obtenerFormulas:", error)
    return { data: null, error: error.message, totalCount: 0 }
  }
}

//Función: obtenerFormulasPorFiltros: funcion para obtener todss lss formulas por el filtrado
export async function obtenerFormulasPorFiltros(nombre = "", clienteId = "", actvio = true, page = 1, limit = 20){
  const offset = (page - 1) * limit
  try {
    let supabaseQuery = supabase
      .from("formulas") // Cambiado de 'hoteles' a 'clientes'
      .select("id, nombre, notaspreparacion, costo, imgurl, activo, cantidad, unidadmedidaid, fechacreacion", { count: "exact" })
      .order("nombre", { ascending: true })

    // Solo aplicar filtro de nombre si tiene valor (no está vacío)
    if (nombre && nombre.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("nombre", `%${nombre}%`)
    }

    if (nombre && nombre.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("nombre", `%${nombre}%`)
    }
    
    const { data: queryData, error: queryError, count } = await supabaseQuery.range(offset, offset + limit - 1)

    if (queryError) {
      console.error("Error al obtener formulas:", queryError)
      return { data: null, error: queryError.message, totalCount: 0 }
    }

    // Mapear los datos para que coincidan con el tipo ClienteResult
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
      })) || []

    return { data: mappedData, error: null, totalCount: count || 0 }
  } catch (error: any) {
    console.error("Error en obtenerFormulas:", error)
    return { data: null, error: error.message, totalCount: 0 }
  }
}

//Función: obtenerFormulaPorId: funcion para obtener la formula por Id de la formula


//Función: actualizarFormula: funcion para actualizar la información de una formula por Id de la formula


//Función: eliminarFormula: funcion para eliminar la información de una formula por Id de la formula


// Función: estatusActivoFormula: función para cambiar el estatus de una formula por Id de la formula


//Función: listaDesplegableFormulas: funcion para obtener todas lss formulas para el input dropdownlist


//Función:estadisticasFormulasTotales: Función estadistica para conocer el total de formulas registradas en la base de datos
