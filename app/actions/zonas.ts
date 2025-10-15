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
//Función: actualizarZona / updZona: funcion para actualizar una Zona
export async function actualizarZona(formData: FormData) {
  try {
    const idString = formData.get("id") as string
    const id = Number(idString)

    // Paso 1: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerZonas(
        -1,
        formData.get("nombre") as string,
        formData.get("clave") as string,
        "Todos",
      )
      return resultado.success && resultado.data && resultado.data.some((zona) => zona.id !== id)
    })()

    if (existe) {
      return {
        success: false,
        error:
          "Los datos que desea actualizar ya los tiene otro registro y no se puede proceder, recuerde que la información debe ser unica.",
      }
    }

    const imgurl = formData.get("imgurl") as string | null

    // Paso 2: Subir imagen para obtener su url
    let imagenurl = ""
    const imagen = formData.get("imagen") as File
    const auxNombre = formData.get("nombre") as string

    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, auxNombre, "clientes")
      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error }
      }
      imagenurl = resultadoImagen.url || ""
    } else {
      imagenurl = imgurl || ""
    }

    // Paso 3: Pasar datos del formData a variables con tipado de datos
    const nombre = formData.get("nombre") as string
    const clave = formData.get("clave") as string
    const direccion = formData.get("direccion") as string
    const telefono = formData.get("telefono") as string
    const email = formData.get("email") as string

    const { data, error } = await supabase
      .from("clientes")
      .update({
        nombre,
        clave,
        direccion,
        telefono,
        email,
        imgurl: imagenurl,
      })
      .eq("id", id)
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error("Error actualizando cliente en query en actualizarCliente de actions/clientes:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/clientes")

    // Return resultados
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en actualizarCliente de actions/clientes:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion actualizarCliente de actions/clientes: " + error,
    }
  }
}

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
export async function estatusActivoZona(id: number, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from("zonas").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error(
        "Error actualizando estatus activo de la zona en estatusActivoZona de app/actions/zonas:",
        error,
      )
      return false
    }

    revalidatePath("/zonas")
    return true
  } catch (error) {
    console.error("Error en estatusActivoZona de app/actions/zonas: ", error)
    return false
  }
}
