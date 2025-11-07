"use server"

/* ==================================================
  Imports
================================================== */
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase"
import { arrActivoTrue, arrActivoFalse } from "@/lib/config"
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
    - objetoZona / oZona (Individual)
    - objetoZonas / oZonas (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearZona / insZona

  * SELECTS: READ/OBTENER/SELECT
    - obtenerZonas / selZonas

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarZona / updZona

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarZona / delZona

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoZona / actZona
    - listaDesplegableZonas / ddlZonas
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoZona / oZona (Individual): Esta Función crea de manera individual un objeto/clase

// Función: objetoZonas / oZonas (Listado): Esta Función crea un listado de objetos/clases, es un array

/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearZona / insZona: Función para insertar
export async function crearZona(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const nombre = (formData.get("nombre") as string)?.trim()
    const clave = (formData.get("clave") as string)?.trim()
    const imagen = formData.get("imagen") as File
    const fecha = new Date().toISOString().split("T")[0]
    const activo = true

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 2) {
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerZonas(-1, nombre, "", "Todos")
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()

    if (existe) {
      return { success: false, error: "La zona que se intenta ingresar ya existe y no se puede proceder." }
    }

    // Paso 4: Subir imagen para obtener su url
    let imagenurl = ""
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "zonas")
      if (resultadoImagen.success) {
        imagenurl = resultadoImagen.url || ""
      } else {
        return { success: false, error: resultadoImagen.error }
      }
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase
      .from("zonas")
      .insert({
        nombre,
        clave,
        imgurl: imagenurl,
        fechacreacion: fecha,
        activo,
      })
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error("Error creando zona en query en crearZona de actions/zonas: ", error)
      return { success: false, error: "Error creando zona en query en crearZona de actions/zonas: " + error.message }
    }

    revalidatePath("/zonas")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en crearZona de actions/zonas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion crearZona de actions/zonas: " + error,
    }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
//Función: obtenerZonas: funcion para obtener
export async function obtenerZonas(id = -1, nombre = "", clave = "", activo = "Todos") {
  try {
    // Paso 1: Preparar Query
    let query = supabase.from("zonas").select(`
        id,
        nombre,
        clave,
        imgurl,
        fechacreacion,
        activo
      `)

    // Paso 2: Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (clave !== "") {
      query = query.ilike("clave", `%${clave}%`)
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

    // Paso 3: Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Paso 4: Varaibles y resultados del query
    const { data, error } = await query

    // Error en query
    if (error) {
      console.error("Error obteniendo zonas de query en obtenerZona de actions/zonas: ", error)
      return { success: false, error: error.message }
    }

    // Paso 5: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerZona de actions/zonas: " + error)
    return { success: false, error: "Error interno del servidor, al ejecutar obtenerZonas de actions/zonas: " + error }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
//Función: actualizarZona / updZona: funcion para actualizar
export async function actualizarZona(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const idString = formData.get("id") as string
    const id = Number(idString)
    const nombre = formData.get("nombre") as string
    const clave = formData.get("clave") as string
    const imgurl = formData.get("imgurl") as string | null
    const imagen = formData.get("imagen") as File

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 3) {
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    /*
    const existe: boolean = await (async () => {
      const resultado = await obtenerZonas(
        -1,
        formData.get("nombre") as string,
        formData.get("clave") as string,
        "Todos",
      )
      if (resultado.success && resultado.data) {
        return resultado.data.some((zona: any) => zona.id !== id)
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
      const resultadoImagen = await imagenSubir(imagen, nombre, "zonas")
      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error }
      } else {
        imagenurl = resultadoImagen.url || ""
      }
    } else {
      imagenurl = imgurl || ""
    }

    // Paso 4: Ejecutar Query
    const { data, error } = await supabase
      .from("zonas")
      .update({
        nombre,
        clave,
        imgurl: imagenurl,
      })
      .eq("id", id)
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error("Error actualizando zona en query en actualizarZona de actions/zonas:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/zonas")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    // Retorno de información
    console.error("Error en actualizarZona de actions/zonas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion actualizarZona de actions/zonas: " + error,
    }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
//Función: eliminarZona / delZona: funcion para
export async function eliminarZona(id: number) {
  try {
    // Paso 1: Validar que id tiene valor
    if (!id || id < 1) {
      return {
        success: false,
        error: "Error eliminando zona en query en eliminarZona de actions/zonas: No se obtuvo el id a eliminar",
      }
    }

    // Paso 2: Verificar que la zona existe
    const { data: zonaExiste } = await supabase.from("zonas").select("id").eq("id", id).single()

    if (!zonaExiste) {
      return { success: false, error: "La zona que intenta eliminar no existe" }
    }

    // Paso 3: Ejecutar Query DELETE
    const { error } = await supabase.from("zonas").delete().eq("id", id)
    // Return si hay error en query
    if (error) {
      console.error("Error eliminando zona en query en eliminarZona de actions/zonas:", error)
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/zonas")

    // Paso 4: Return resultados
    return { success: true, data: { id, message: "Zona eliminada exitosamente" } }
  } catch (error) {
    console.error("Error en eliminarZona de actions/zonas: " + error)
    // Return info
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion eliminarZona de actions/zonas: " + error,
    }
  }
}

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoZona / actZona: Función especial para cambiar columna activo, el valor debe ser boolean
export async function estatusActivoZona(id: number, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from("zonas").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error("Error actualizando estatus activo de la zona en estatusActivoZona de app/actions/zonas:", error)
      return false
    }

    revalidatePath("/zonas")
    return true
  } catch (error) {
    console.error("Error en estatusActivoZona de app/actions/zonas: ", error)
    return false
  }
}

// Función: listaDesplegableZonas / ddlZonas: Función que se utiliza para los dropdownlist
export async function listDesplegableZonas(zonaid = -1, zonanombre = "", clienteid = -1) {
  try {
    // Paso 1: Preparar Query
    let query = supabase.from("zonasxcliente").select(`
        idrec,
        clienteid,
        zonaid,
        zonas!zonaid(
        id,
        nombre)
      `)

    // Paso 2: Filtros en query, dependiendo parametros
    if (zonaid !== -1) {
      query = query.eq("id", zonaid)
    }
    if (zonanombre !== "") {
      query = query.ilike("zonas.nombre", `%${zonanombre}%`)
    }
    if (clienteid !== -1) {
      query = query.eq("clienteid", clienteid)
    }

    // Paso 3: Ejecutar query
    query = query.order("idrec", { ascending: true })

    // Paso 4: Variables y resultados del query
    const { data: zonas, error } = await query

    // Error en query
    if (error) {
      console.error("Error obteniendo zonas de query en listDesplegableZonas de actions/zonas: ", error)
      return { success: false, error: error.message }
    }

    // Paso 5: Transformar datos al formato ddlItem
    const data: { value: string; text: string }[] = zonas
      ? zonas.map((zona: any) => ({
          value: zona.zonas.id.toString(),
          text: zona.zonas.nombre,
        }))
      : []

    // Paso 6: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en listDesplegableZonas de actions/zonas: " + error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar listDesplegableZonas de actions/zonas: " + error,
    }
  }
}
