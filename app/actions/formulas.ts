"use server"

/* ==================================================
  Imports
================================================== */
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase"
import { arrActivoTrue, arrActivoFalse } from "@/lib/config"
import { obtenerProductosXClientes } from "@/app/actions/productos"
import { imagenSubir } from "@/app/actions/utilerias"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  --------------------
  Objetos / Clases
  --------------------
  * Objetos
    - objetoFormula / oFormula (Individual)
    - objetoFormulas / oFormulas (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearFormula / insFormula
  * SELECTS: READ/OBTENER/SELECT
    - obtenerFormulas / selFormulas
    - obtenerFormulasXClientes / selFormulasXClientes
    - obtenerFormulasXProductos / selFormulasXProductos
  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarFormula / updFormula    
  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarFormula / delFormula
  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - listaDesplegableFormulas / ddlFormulas
    - estadisticasFormulas / statsFormulas
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoFormula / oFormula (Individual): Esta Función crea de manera individual un objeto/clase


// Función: objetoFormulaS / oFormulaS (Listado): Esta Función crea un listado de objetos/clases, es un array


/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función crearFormula / insFormula: Función para insertar
export async function crearFormula(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const codigo = (formData.get("codigo") as string)?.trim()
    const nombre = (formData.get("nombre") as string)?.trim()
    const unidadmedidaid = Number.parseInt(formData.get("unidadmedidaid") as string) || 0
    const imagen = formData.get("imagen") as File
    const costo = Number.parseFloat(formData.get("costo") as string) || 0
    const fecha = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
    const activo = true

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 2) {
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerFormulas(-1, codigo, nombre, "Todos", -1, -1)
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()
    if (existe) {
      return { success: false, error: "La formula que se intenta ingresar ya existe y no se puede proceder." }
    }

    // Paso 4: Subir imagen para obtener su url
    let imagenurl = ""
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "formulas")
      if (resultadoImagen.success) {
        imagenurl = resultadoImagen.url || ""
      } else {
        return { success: false, error: resultadoImagen.error }
      }
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase
      .from("formulas")
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
      console.error("Error creando formula en query en crearFormula de actions/formulas: ", error)
      return {
        success: false,
        error: "Error creando formula en query en crearFormula de actions/formulas: " + error.message,
      }
    }

    revalidatePath("/formulas")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    // Retorno de información
    console.error("Error en crearFormula de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion crearFormula de actions/formulas: " + error,
    }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
//Función: obtenerFormulas / selFormulas: Función para obtener 
export async function obtenerFormulas(
  id = -1,
  codigo = "",
  nombre = "",
  activo = "Todos",
  clienteid = -1,
  productoid = -1,
) {
  try {
    // Paso 1: Obtener arrays de las formulasid que esten por cliente y/o por producto
    let IdsXCliente: number[] = []
    if (clienteid > 0) {
      const resultado = await obtenerFormulasXClientes(clienteid)
      if (resultado.success && resultado.data) {
        IdsXCliente = resultado.data
      }
    }
    let IdsXProducto: number[] = []
    if (productoid > 0) {
      const resultado = await obtenerFormulasXProductos(productoid)
      if (resultado.success && resultado.data) {
        IdsXProducto = resultado.data
      }
    }
    const IdsMerge: number[] = [...new Set([...IdsXCliente, ...IdsXProducto])]

    // Paso 2: Preparar Query
    let query = supabase.from("formulas").select(`
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
    if (clienteid > 0 || productoid > 0) {
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
      console.error("Error obteniendo formulas en query en obtenerFormulas de actions/formulas:", error)
      return { success: false, error: error.message }
    }

    // Paso 6: Retorno de data
    return { success: true, data }
  } catch (error) {
    // Retorno de información
    console.error("Error en obtenerFormulas de actions/formulas:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar obtenerFormulas de actions/formulas" }
  }
}

//Función: obtenerFormulasXClientes / selFormulasXClientes, funcion para obtener en un array el listado de los ids de formulas
export async function obtenerFormulasXClientes(
  clienteid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (clienteid <= 0) {
      return { success: false, error: "ID de cliente inválido" }
    }

    let Ids: number[] = []
    if (clienteid > 0) {
      const resultado = await obtenerProductosXClientes(clienteid)
      if (resultado.success && resultado.data) {
        Ids = resultado.data
      }
    }

    const { data, error } = await supabase.from("formulasxproducto").select("formulaid").in("productoid", Ids)

    if (error) {
      console.error("Error en query obtenerFormulasXClientes:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.formulaid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerFormulasXClientes de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerFormulasXClientes de actions/formulas",
    }
  }
}

//Función: obtenerFormulasXProductos / selFormulasXProductos, funcion para obtener en un array el listado de los ids de formulas
export async function obtenerFormulasXProductos(
  productoid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (productoid <= 0) {
      return { success: false, error: "ID de producto inválido" }
    }

    const { data, error } = await supabase.from("formulasxproducto").select("formulaid").eq("productoid", productoid)

    if (error) {
      console.error("Error en query obtenerFormulasXProductos de actions/formulas:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.formulaid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerFormulasXProductos de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerFormulasXProductos de actions/formulas",
    }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
//Función: actualizarFormula / updateFormula: Función para actualizar
export async function actualizarFormula(formData: FormData) {
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
      const resultado = await obtenerFormulas(
        -1,
        formData.get("codigo") as string,
        formData.get("nombre") as string,
        "Todos",
        -1,
        -1,
      )
      if (resultado.success && resultado.data) {
        return resultado.data.some((formula: any) => formula.id !== id)
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
      const resultadoImagen = await imagenSubir(imagen, nombre, "formulas")
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
      .from("formulas")
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
      console.error("Error actualizando formula en query en actualizarFormula de actions/formulas:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/formulas")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en actualizarFormula de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarFormula de actions/formulas",
    }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
//Función: eliminarFormula / delFormula: Función para eliminar
export async function eliminarFormula(id: number) {
  try {
    // Paso 1: Validar que id tiene valor
    if (!id || id < 1) {
      return {
        success: false,
        error:
          "Error eliminando formula en query en eliminarFormula de actions/formulas: No se obtuvo el id a eliminar",
      }
    }

    // Paso 2: Verificar que la formula existe
    const { data: formulaExiste } = await supabase.from("formulas").select("id").eq("id", id).single()

    if (!formulaExiste) {
      return { success: false, error: "La formula que intenta eliminar no existe" }
    }

    // Paso 3: Ejecutar Query DELETE
    const { error } = await supabase.from("formulas").delete().eq("id", id)
    // Return si hay error en query
    if (error) {
      console.error("Error eliminando formula en query en eliminarFormula de actions/formulas:", error)
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/formulas")

    // Paso 4: Return resultados
    return { success: true, data: { id, message: "Formula eliminada exitosamente" } }
  } catch (error) {
    console.error("Error en eliminarFormula de actions/formulas: " + error)
    // Return info
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion eliminarFormula de actions/formulas: " + error,
    }
  }
}

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoFormula: Función especial para cambiar columna activo, el valor debe ser boolean
export async function estatusActivoFormula(id: number, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from("formulas").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error(
        "Error actualizando estatus activo de la formula en estatusActivoFormula de app/actions/formulas:",
        error,
      )
      return false
    }

    revalidatePath("/formulas")
    return true
  } catch (error) {
    console.error("Error en estatusActivoFormula de app/actions/formulas: ", error)
    return false
  }
}

// Función: listaDesplegableFormulas: Función que se utiliza para los dropdownlist
export async function listaDesplegableFormulas() {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error al obtener formulas para dropdown:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en listaDesplegableFormulas:", error)
    return { data: null, error: error.message }
  }
}
