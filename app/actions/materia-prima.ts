"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { obtenerFormulasXProductos } from "@/app/actions/productos"
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
    - objetoMateriaPrima / oMateriaPrima (Individual)
    - objetoMateriasPrimas / oMateriasPrimas (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearMateriaPrima / insMateriaPrima
  * READS-OBTENER (SELECTS)
    - obtenerMateriasPrimas / selMateriasPrimas
    - obtenerMateriasPrimasXProductos / selMateriasPrimasXProductos
    - obtenerMateriasPrimasXFormulas / selMateriasPrimasXFormulas
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarMateriaPrima / updMateriaPrima
  * DELETES-ELIMINAR (DELETES)
    - eliminarMateriaPrima / delMateriaPrima
  * SPECIALS-ESPECIALES ()
    - estatusActivoMateriaPrima / actMateriaPrima
    - listaDesplegableMateriasPrimas / ddlMateriasPrimas
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */

/*==================================================
    CREATES-CREAR (INSERTS)
================================================== */
// Función crearMateriaPrima / insMateriaPrima: función para crear una materia prima
export async function crearMateriaPrima(formData: FormData) {
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
    if (!codigo || codigo.length < 2) {
      return { success: false, error: "El parametro codigo, esta incompleto. Favor de verificar." }
    }
    if (!nombre || nombre.length < 2) {
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerMateriasPrimas(-1, codigo, nombre, "Todos", -1, -1)
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()

    if (existe) {
      return { success: false, error: "La materia prima que se intenta ingresar ya existe y no se puede proceder." }
    }

    // Paso 4: Subir imagen para obtener su url
    let imagenurl = ""
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "materiasprima")
      if (resultadoImagen.success) {
        imagenurl = resultadoImagen.url || ""
      } else {
        return { success: false, error: resultadoImagen.error }
      }
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase
      .from("materiasprima")
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
      console.error("Error creando materia prima en query en crearMateriaPrima de actions/materia-prima: ", error)
      return {
        success: false,
        error: "Error creando materia prima en query en crearMateriaPrima de actions/materia-prima: " + error.message,
      }
    }

    revalidatePath("/materiaprima")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en crearMateriaPrima de actions/materia-prima:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion crearMateriaPrima de actions/materia-prima: " + error,
    }
  }
}

/*==================================================
  READS-OBTENER (SELECTS)
================================================== */
// Función: obtenerMateriasPrimas / selMateriasPrimas: función para obtener la o las materias primas
export async function obtenerMateriasPrimas(
  id = -1,
  codigo = "",
  nombre = "",
  activo = "Todos",
  formulaid = -1,
  productoid = -1,
) {
  try {
    // Paso 1: Obtener arrays de las formulasid que esten por cliente y/o por producto
    let IdsXFormula: number[] = []
    if (formulaid > 0) {
      const resultado = await obtenerMateriasPrimasXFormulas(formulaid)
      if (resultado.success && resultado.data) {
        IdsXFormula = resultado.data
      }
    }

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
      console.error(
        "Error obteniendo materias primas en query en obtenerMateriasPrimas de actions/materia-prima:",
        error,
      )
      return { success: false, error: error.message }
    }

    // Paso 6: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerMateriasPrimas de actions/materia-prima:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerMateriasPrimas de actions/materia-prima",
    }
  }
}

// Función: obtenerMateriasPrimasXProductos / selMateriasPrimasXProductos, funcion para obtener en un array el listado de los ids de materias primas
export async function obtenerMateriasPrimasXProductos(
  productoid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (productoid <= 0) {
      return { success: false, error: "ID de producto inválido" }
    }

    let Ids: number[] = []
    if (productoid > 0) {
      const resultado = await obtenerFormulasXProductos(productoid)
      if (resultado.success && resultado.data) {
        Ids = resultado.data
      }
    }

    const { data, error } = await supabase.from("materiasprimasxformula").select("materiaprimaid").in("formulaid", Ids)

    if (error) {
      console.error("Error en query obtenerMateriasPrimasXProductos de actions/materia-prima:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.materiaprimaid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerMateriasPrimasXProductos de actions/materia-prima:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerMateriasPrimasXProductos de actions/materia-prima",
    }
  }
}

// Función: obtenerMateriasPrimasXFormulas / selMateriasPrimasXFormulas, funcion para obtener en un array el listado de los ids de materias primas
export async function obtenerMateriasPrimasXFormulas(
  formulaid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (formulaid <= 0) {
      return { success: false, error: "ID de formula inválido" }
    }

    const { data, error } = await supabase
      .from("materiasprimasxformula")
      .select("materiaprimaid")
      .eq("formulaid", formulaid)

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
// Función: actualizarMateriaPrima / updateMateriaPrima: funcion para actualizar una materia prima
export async function actualizarMateriaPrima(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const idString = formData.get("id") as string
    const id = Number(idString)
    const codigo = formData.get("codigo") as string
    const nombre = formData.get("nombre") as string
    const imgurl = formData.get("imgurl") as string | null
    const imagen = formData.get("imagen") as File
    const unidadmedidaid = Number.parseInt(formData.get("unidadmedidaid") as string) || null
    const costo = Number.parseFloat(formData.get("costo") as string) || 0

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 3) {
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    /*
    const existe: boolean = await (async () => {
      const resultado = await obtenerMateriasPrimas(
        -1,
        formData.get("codigo") as string,
        formData.get("nombre") as string,
        "Todos",
        -1,
        -1,
      )
      if (resultado.success && resultado.data) {
        return resultado.data.some((materiaPrima: any) => materiaPrima.id !== id)
      }
      return false
    })()

    if (existe) {
      return {
        success: false,
        error:
          "Los datos que desea actualizar ya los tiene otro registro y no se puede proceder, recuerde que la información debe ser unica.",
      }
    }
    */

    // Paso 4: Subir imagen para obtener su url
    let imagenurl = ""
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "materiasprima")
      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error }
      } else {
        imagenurl = resultadoImagen.url || ""
      }
    } else {
      imagenurl = imgurl || ""
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase
      .from("materiasprima")
      .update({
        codigo,
        nombre,
        imgurl: imagenurl,
        unidadmedidaid,
        costo,
      })
      .eq("id", id)
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error(
        "Error actualizando materia prima en query en actualizarMateriaPrima de actions/materia-prima:",
        error,
      )
      return { success: false, error: error.message }
    }

    revalidatePath("/materiaprima")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en actualizarMateriaPrima de actions/materia-prima:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarMateriaPrima de actions/materia-prima",
    }
  }
}

/*==================================================
  * DELETES-ELIMINAR (DELETES)
================================================== */
// Función: eliminarMateriaPrima / delMateriaPrima: funcion para eliminar una materia prima
export async function eliminarMateriaPrima(id: number) {
  try {
    // Paso 1: Validar que id tiene valor
    if (!id || id < 1) {
      return {
        success: false,
        error:
          "Error eliminando materia prima en query en eliminarMateriaPrima de actions/materia-prima: No se obtuvo el id a eliminar",
      }
    }

    // Paso 2: Verificar que la materia prima existe
    const { data: materiaPrimaExiste } = await supabase.from("materiasprima").select("id").eq("id", id).single()

    if (!materiaPrimaExiste) {
      return { success: false, error: "La materia prima que intenta eliminar no existe" }
    }

    // Paso 3: Ejecutar Query DELETE
    const { error } = await supabase.from("materiasprima").delete().eq("id", id)
    // Return si hay error en query
    if (error) {
      console.error("Error eliminando materia prima en query en eliminarMateriaPrima de actions/materia-prima:", error)
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/materiaprima")

    // Paso 4: Return resultados
    return { success: true, data: { id, message: "Materia prima eliminada exitosamente" } }
  } catch (error) {
    console.error("Error en eliminarMateriaPrima de actions/materia-prima: " + error)
    // Return info
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion eliminarMateriaPrima de actions/materia-prima: " + error,
    }
  }
}

/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */
// Función: estatusActivoMateriaPrima / actMateriaPrima: funcion para actualizar el estatus activo de una materia prima
export async function estatusActivoMateriaPrima(id: number, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from("materiasprima").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error(
        "Error actualizando estatus activo de la materia prima en estatusActivoMateriaPrima de app/actions/materia-prima:",
        error,
      )
      return false
    }

    revalidatePath("/materiaprima")
    return true
  } catch (error) {
    console.error("Error en estatusActivoMateriaPrima de app/actions/materia-prima: ", error)
    return false
  }
}
