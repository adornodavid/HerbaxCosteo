"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { arrActivoTrue, arrActivoFalse } from "@/lib/config"
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
    - objetoZona / oZona (Individual)
    - objetoZonas / oZonas (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearZona / insZona
  * READS-OBTENER (SELECTS)
    - obtenerZonas / selZonas
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarZona / updZona
  * DELETES-ELIMINAR (DELETES)
    - eliminarZona / delZona
  * SPECIALS-ESPECIALES ()
    - estatusActivoZona / actZona
    - listaDesplegableZonas / ddlZonas
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */

/*==================================================
    CREATES-CREAR (INSERTS)
================================================== */
// Función: crearZona / insZona: Función para insertar una Zona
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
  READS-OBTENER (SELECTS)
================================================== */
//Función: obtenerZonas: funcion para obtener todas las zonas
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
  UPDATES-ACTUALIZAR (UPDATES)
================================================== */

/*==================================================
  * DELETES-ELIMINAR (DELETES)
================================================== */
//Función: eliminarZona / delZona: funcion para eliminar una zona
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
  * SPECIALS-ESPECIALES ()
================================================== */
