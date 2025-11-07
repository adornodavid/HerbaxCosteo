"use server"

/* ==================================================
  Imports
================================================== */
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase"
import { arrActivoTrue, arrActivoFalse } from "@/lib/config"
import { obtenerFormulasXProductos } from "@/app/actions/formulas"
import { imagenSubir } from "@/app/actions/utilerias"
import type { ddlItem } from "@/types" // Import ddlItem type

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
  * INSERTS: CREATE/CREAR/INSERT
    - crearMateriaPrima / insMateriaPrima
    - crearMateriaPrimaXFormula
  * SELECTS: READ/OBTENER/SELECT
    - obtenerMateriasPrimas / selMateriasPrimas
    - obtenerIdsMateriasPrimasXProductos / selIdsMateriasPrimasXProductos
    - obtenerIdsMateriasPrimasXFormulas / selIdsMateriasPrimasXFormulas
  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarMateriaPrima / updMateriaPrima
  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarMateriaPrima / delMateriaPrima
    - eliminarMateriaPrimaXFormula
  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoMateriaPrima / actMateriaPrima
    - listaDesplegableMateriasPrimas / ddlMateriasPrimas
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoMateriaPrima / oMateriaPrima (Individual): Esta Función crea de manera individual un objeto/clase

// Función: objetoMateriasPrimas / oMateriasPrimas (Listado): Esta Función crea un listado de objetos/clases, es un array

/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función crearMateriaPrima / insMateriaPrima: Función para insertar
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

// Función: crearMateriPrimaXFromula
export async function crearMateriaPrimaXFormula(materiaprimaid: number, formulaid: number, cantidad: number) {
  try {
    // Paso 1: Validar parámetros
    if (!materiaprimaid || materiaprimaid <= 0 || !formulaid || formulaid <= 0 || !cantidad || cantidad <= 0) {
      return {
        success: false,
        error:
          "No se recibieron los parametros necesario para poder proceder en ejecutar la funcion crearMateriaPrimaXFormula en app/actions/materia-prima",
      }
    }

    // Paso 2: Obtener costo unitario de la materia prima
    const { data: materiaPrimaData, error: materiaPrimaError } = await supabase
      .from("materiasprima")
      .select("costo")
      .eq("id", materiaprimaid)
      .single()

    if (materiaPrimaError || !materiaPrimaData) {
      console.error(
        "Error obteniendo costo de materia prima en crearMateriaPrimaXFormula de actions/materia-prima:",
        materiaPrimaError,
      )
      return {
        success: false,
        error:
          "Error obteniendo costo de materia prima: " +
          (materiaPrimaError?.message || "No se encontró la materia prima"),
      }
    }

    const costounitario = materiaPrimaData.costo || 0

    // Paso 3: Calcular costo parcial
    const costoparcial = cantidad * costounitario

    // Paso 4: Insertar en la tabla materiasprimasxformula
    const fecha = new Date().toISOString().split("T")[0]

    const { error: insertError } = await supabase.from("materiasprimasxformula").insert({
      formulaid,
      materiaprimaid,
      cantidad,
      costoparcial,
      fechacreacion: fecha,
      activo: true,
    })

    if (insertError) {
      console.error(
        "Error insertando materia prima x formula en crearMateriaPrimaXFormula de actions/materia-prima:",
        insertError,
      )
      return {
        success: false,
        error: "Error insertando relación materia prima x formula: " + insertError.message,
      }
    }

    revalidatePath("/formulas")

    // Paso 5: Return exitoso
    return { success: true }
  } catch (error) {
    console.error("Error en crearMateriaPrimaXFormula de actions/materia-prima:", error)
    return {
      success: false,
      error:
        "Error interno del servidor, al ejecutar funcion crearMateriaPrimaXFormula de actions/materia-prima: " + error,
    }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerMateriasPrimas / selMateriasPrimas: Función para obtener
export async function obtenerMateriasPrimas(
  id = -1,
  codigo = "",
  nombre = "",
  activo = "Todos",
  formulaid = -1,
  productoid = -1,
) {
  try {
    // Paso 1: Obtener arrays de las materiasprimaid que esten por formula y/o por producto
    let IdsXFormula: number[] = []
    if (formulaid > 0) {
      const resultado = await obtenerIdsMateriasPrimasXFormulas(formulaid)
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
    let query = supabase.from("materiasprima").select(`
        id,
        codigo,
        nombre,
        imgurl,
        unidadmedidaid,
        unidadesmedida(descripcion),
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
      const isActive = arrActivoTrue.includes(activo)
      const isInactive = arrActivoFalse.includes(activo)
      if (isActive) {
        query = query.eq("activo", true)
      } else if (isInactive) {
        query = query.eq("activo", false)
      }
    }
    if (formulaid > 0 || productoid > 0) {
      if (IdsMerge.length > 0) {
        query = query.in("id", IdsMerge)
      }
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

// Función: obtenerIdsMateriasPrimasXFormulas / selIdsMateriasPrimasXFormulas, funcion para obtener en un array el listado de los ids de materias primas
export async function obtenerIdsMateriasPrimasXFormulas(
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
      console.error("Error en query obtenerIdsMateriasPrimasXFormulas de actions/materia-prima:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.materiaprimaid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerIdsMateriasPrimasXFormulas de actions/materia-prima:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerIdsMateriasPrimasXFormulas de actions/materia-prima",
    }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarMateriaPrima / updateMateriaPrima: Función para actualizar
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
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarMateriaPrima / delMateriaPrima: Función para eliminar
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

// Función: eliminarMateriaPrimaXFormula: Función para eliminar la relación entre materia prima y formula
export async function eliminarMateriaPrimaXFormula(materiaPrimaId: number, formulaid: number) {
  try {
    // Paso 1: Validar parámetros
    if (!materiaPrimaId || materiaPrimaId <= 0 || !formulaid || formulaid <= 0) {
      return {
        success: false,
        error:
          "No se recibieron los parametros necesarios para ejecutar la funcion, en eliminarMateriaPrimaXFormula de app/actions/materia-prima",
      }
    }

    // Paso 2: Ejecutar Query DELETE
    const { error } = await supabase
      .from("materiasprimasxformula")
      .delete()
      .eq("materiaprimaid", materiaPrimaId)
      .eq("formulaid", formulaid)

    // Return si hay error en query
    if (error) {
      console.error(
        "Error eliminando relación materia prima x formula en eliminarMateriaPrimaXFormula de actions/materia-prima:",
        error,
      )
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/formulas")

    // Paso 3: Return resultados
    return { success: true }
  } catch (error) {
    console.error("Error en eliminarMateriaPrimaXFormula de actions/materia-prima: " + error)
    return {
      success: false,
      error:
        "Error interno del servidor, al ejecutar funcion eliminarMateriaPrimaXFormula de actions/materia-prima: " +
        error,
    }
  }
}

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoMateriaPrima / actMateriaPrima: Función especial para cambiar columna activo, el valor debe ser boolean
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

// Función: listaDesplegableMateriasPrimasBuscar: Función que se utiliza para los dropdownlist con búsqueda
export async function listaDesplegableMateriasPrimasBuscar(buscar: string): Promise<ddlItem[]> {
  try {
    let query = supabase.from("materiasprima").select("id, codigo, nombre").eq("activo", true)

    // Apply filter: search in nombre OR codigo
    if (buscar && buscar.trim() !== "") {
      query = query.or(`nombre.ilike.%${buscar}%,codigo.ilike.%${buscar}%`)
    }

    // Order by nombre
    query = query.order("nombre", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo lista desplegable de materias primas:", error)
      return []
    }

    // Map results to ddlItem format: value = id, text = "codigo - nombre"
    const items: ddlItem[] =
      data?.map((materiaPrima) => ({
        value: materiaPrima.id.toString(),
        text: `${materiaPrima.codigo} - ${materiaPrima.nombre}`,
      })) || []

    return items
  } catch (error) {
    console.error("Error en app/actions/materia-prima en listaDesplegableMateriasPrimasBuscar:", error)
    return []
  }
}

// Función: listaDesplegableMateriasPrimas / ddlMateriasPrimas: Función que se utiliza para los dropdownlist
