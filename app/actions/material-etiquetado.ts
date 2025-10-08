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
  formulaid = -1,
  productoid = -1,
) {
  try {
    // Paso 1: Obtener arrays de las formulasid que esten por cliente y/o por producto
    /*
    let IdsXFormula: number[] = []
    if (formulaid > 0) {
      const resultado = await obtenerMateriasPrimasXFormulas(formulaid)
      if (resultado.success && resultado.data) {
        IdsXFormula = resultado.data
      }
    }
    */

    let IdsXProducto: number[] = []
    if (productoid > 0) {
      const resultado = await obtenerMateriasPrimasXProductos(productoid)
      if (resultado.success && resultado.data) {
        IdsXProducto = resultado.data
      }
    }

    const IdsMerge: number[] = [...new Set([...IdsXFormula, ...IdsXProducto])]

    // Paso 2: Preparar Query
    let query = supabase.from("materiasprimas").select(`
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
    if (IdsMerge.length > 0) {
      query = query.in("id", IdsMerge)
    }

    // Paso 4: Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Paso 5: Varaibles y resultados del query
    const { data, error } = await query

    // Error en query
    if (error) {
      console.error("Error obteniendo materias primas en query en obtenerMateriasPrimas de actions/materia-prima:", error)
      return { success: false, error: error.message }
    }

    // Paso 6: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerMateriasPrimas de actions/materia-prima:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar obtenerMateriasPrimas de actions/materia-prima" }
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
