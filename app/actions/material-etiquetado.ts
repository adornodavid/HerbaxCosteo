"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { imagenSubir } from "@/app/actions/utilerias"

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
// Función crearMaterialEtiquetado / insMaterialEtiquetado: función para crear un material de etiquetado
export async function crearMaterialEtiquetado(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const codigo = (formData.get("codigo") as string)?.trim()
    const nombre = (formData.get("nombre") as string)?.trim()
    const unidadmedidaid = Number.parseInt(formData.get("unidadmedidaid") as string) || 0
    const imagen = formData.get("imagen") as File
    const costo = Number.parseFloat(formData.get("costo") as string) || 0
    const fecha = new Date().toISOString().split("T")[0]
    const activo = true

    // Paso 2: Validar variables obligatorias
    if (!codigo || codigo.length < 3) {
      return { success: false, error: "El parametro codigo, esta incompleto. Favor de verificar." }
    }
    if (!nombre || nombre.length < 3) {
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerMaterialesEtiquetados(-1, codigo, nombre, "Todos", -1)
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()

    if (existe) {
      return {
        success: false,
        error: "El material de etiquetado que se intenta ingresar ya existe y no se puede proceder.",
      }
    }

    // Paso 4: Subir imagen para obtener su url
    let imagenurl = ""
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "materialesetiquetado")
      if (resultadoImagen.success) {
        imagenurl = resultadoImagen.url || ""
      } else {
        return { success: false, error: resultadoImagen.error }
      }
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .insert({
        codigo,
        nombre,
        imgurl: imagenurl,
        unidadmedidaid,
        costo,
        fechacreacion: fecha,
        activo,
      })
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error(
        "Error creando material de etiquetado en query en crearMaterialEtiquetado de actions/material-etiquetado: ",
        error,
      )
      return {
        success: false,
        error:
          "Error creando material de etiquetado en query en crearMaterialEtiquetado de actions/material-etiquetado: " +
          error.message,
      }
    }

    revalidatePath("/materialetiquetado")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en crearMaterialEtiquetado de actions/material-etiquetado:", error)
    return {
      success: false,
      error:
        "Error interno del servidor, al ejecutar funcion crearMaterialEtiquetado de actions/material-etiquetado: " +
        error,
    }
  }
}

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
      const resultado = await obtenerMaterialesEtiquetadosXProductos(productoid)
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
      console.error(
        "Error obteniendo materiales de etiquetado en query en obtenerMaterialesEtiquetados de actions/material-etiquetado:",
        error,
      )
      return { success: false, error: error.message }
    }

    // Paso 6: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerMaterialesEtiquetados de actions/material-etiquetado:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerMaterialesEtiquetados de actions/material-etiquetado",
    }
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

    const { data, error } = await supabase
      .from("materialesetiquetadoxproductos")
      .select("materialetiquetadoid")
      .eq("productoid", productoid)

    if (error) {
      console.error("Error en query obtenerMaterialesEtiquetadosXProductos de actions/material-etiquetado:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.materialetiquetadoid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerMaterialesEtiquetadosXProductos de actions/material-etiquetado:", error)
    return {
      success: false,
      error:
        "Error interno del servidor, al ejecutar obtenerMaterialesEtiquetadosXProductos de actions/material-etiquetado",
    }
  }
}

/*==================================================
  UPDATES-ACTUALIZAR (UPDATES)
================================================== */

/*==================================================
  * DELETES-ELIMINAR (DELETES)
================================================== */
// Función: eliminarMaterialEtiquetado / delMaterialEtiquetado: funcion para eliminar un material de etiquetado
export async function eliminarMaterialEtiquetado(id: number) {
  try {
    // Paso 1: Validar que id tiene valor
    if (!id || id < 1) {
      return {
        success: false,
        error:
          "Error eliminando material de etiquetado en query en eliminarMaterialEtiquetado de actions/material-etiquetado: No se obtuvo el id a eliminar",
      }
    }

    // Paso 2: Verificar que el material de etiquetado existe
    const { data: materialEtiquetadoExiste } = await supabase
      .from("materialesetiquetado")
      .select("id")
      .eq("id", id)
      .single()

    if (!materialEtiquetadoExiste) {
      return { success: false, error: "El material de etiquetado que intenta eliminar no existe" }
    }

    // Paso 3: Ejecutar Query DELETE
    const { error } = await supabase.from("materialesetiquetado").delete().eq("id", id)
    // Return si hay error en query
    if (error) {
      console.error(
        "Error eliminando material de etiquetado en query en eliminarMaterialEtiquetado de actions/material-etiquetado:",
        error,
      )
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/materialetiquetado")

    // Paso 4: Return resultados
    return { success: true, data: { id, message: "Material de etiquetado eliminado exitosamente" } }
  } catch (error) {
    console.error("Error en eliminarMaterialEtiquetado de actions/material-etiquetado: " + error)
    // Return info
    return {
      success: false,
      error:
        "Error interno del servidor, al ejecutar funcion eliminarMaterialEtiquetado de actions/material-etiquetado: " +
        error,
    }
  }
}

/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */
