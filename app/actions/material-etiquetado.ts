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
const supabase = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

/* ==================================================
  --------------------
  Objetos / Clases
  --------------------
  * Objetos
    - objetoMaterialEtiquetado / oMaterialEtiquetado (Individual)
    - objetoMaterialesEtiquetados / oMaterialesEtiquetados (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearMaterialEtiquetado / insMaterialEtiquetado
  * READS-OBTENER (SELECTS)
    - obtenerMaterialesEtiquetados / selMaterialesEtiquetados
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarMaterialEtiquetado / updMaterialEtiquetado
  * DELETES-ELIMINAR (DELETES)
    - eliminarMaterialEtiquetado / delMaterialEtiquetado
  * SPECIALS-ESPECIALES ()
    - estatusActivoMaterialEtiquetado / actMaterialEtiquetado
    - listaDesplegableMaterialesEtiquetados / ddlMaterialesEtiquetados
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */

/*==================================================
    CREATES-CREAR (INSERTS)
================================================== */

/*==================================================
  READS-OBTENER (SELECTS)
================================================== */
// Función: obtenerMaterialesEtiquetados / selMaterialesEtiquetados: Función para obtener el o los materiales de etiquetado
export async function obtenerMaterialesEtiquetados(
  id = -1,
  codigo = "",
  nombre = "",
  activo = "Todos",
  productoid = -1,
  //formulaid = -1,
) {
  try {
    // Paso 1: Obtener arrays de las formulasid que esten por cliente y/o por producto
    let IdsXProducto: number[] = []
    if (productoid > 0) {
      const resultado = await obtenerMaterialesEtiquetadoXProductos(productoid)
      if (resultado.success && resultado.data) {
        IdsXProducto = resultado.data
      }
    }

    /*
    let IdsXFormula: number[] = []
    if (formulaid > 0) {
      const resultado = await obtenerMateriasPrimasXFormulas(formulaid)
      if (resultado.success && resultado.data) {
        IdsXFormula = resultado.data
      }
    }
    */

    //const IdsMerge: number[] = [...new Set([...IdsXFormula, ...IdsXProducto])]

    // Paso 2: Preparar Query
    let query = supabase.from("materialesetiquetado").select(`
        id,
        codigo,
        nombre,
        imgurl,
        unidadmedidaid,
        unidadesmedida!unidadmedidaid(descripcion),
        costo,
        fechacreacion,
        activo
      `)

    // Paso 3: Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (codigo !== "") {
      query = query.ilike("codigo", `%${codigo}%`)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (activo !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activo)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activo)
      if (isActive) {
        query = query.eq("activo", true)
      } else if (isInactive) {
        query = query.eq("activo", false)
      }
    }
    if (IdsXProducto.length > 0) {
      query = query.in("id", IdsXProducto)
    }

    // Paso 4: Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Paso 5: Varaibles y resultados del query
    const { data, error } = await query

    // Error en query
    if (error) {
      console.error("Error obteniendo materiales de etiquetado en query en obtenerMaterialesEtiquetados de actions/material-etiquetado:", error)
      return { success: false, error: error.message }
    }

    // Paso 6: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerMaterialesEtiquetados de actions/material-etiquetado:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar obtenerMaterialesEtiquetados de actions/material-etiquetado" }
  }
}

// Función: obtenerMaterialesEtiquetadosXProductos / selMaterialesEtiquetadosXProductos, funcion para obtener en un array el listado de los ids de materiales de etiquetado
export async function obtenerMaterialesEtiquetadosXProductos(
  productoid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (productoid <= 0) {
      return { success: false, error: "ID de producto inválido" }
    }

    const { data, error } = await supabase.from("materialesetiquetadoxproductos").select("materiaprimaid").eq("productoid", productoid)

    if (error) {
      console.error("Error en query obtenerMateriasPrimasXFormulas de actions/materia-prima:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.materiaprimaid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerMateriasPrimasXFormulas de actions/materia-prima:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerMateriasPrimasXFormulas de actions/materia-prima",
    }
  }
}

/*==================================================
  UPDATES-ACTUALIZAR (UPDATES)
================================================== */

/*==================================================
  * DELETES-ELIMINAR (DELETES)
================================================== */


/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */
