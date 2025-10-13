"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from '@/lib/supabase'
import { RolesAdmin, arrActivoTrue, arrActivoFalse } from "@/lib/config"

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
    // Paso 1: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerZonas(
        -1,
        formData.get("nombre") as string,
        formData.get("clave") as string,
      )
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()

    if (existe) {
      return { success: false, error: "La zona que se intenta ingresar ya existe y no se puede proceder" }
    }

    // Paso 2: Subir imagen para obtener su url
    let imagenurl = ""
    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, formData.get("nombre") as string, "zonas")
      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error || "Error al subir la imagen" }
      }
      imagenurl = resultadoImagen.url || ""
    }

    // Paso 3: Pasar datos del formData a variables con tipado de datos
    const nombre = formData.get("nombre") as string
    const clave = formData.get("clave") as string
    const fecha = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
    const activo = true

    // Paso 4: Ejecutar Query
    const { data, error } = await supabase
      .from("zonas")
      .insert({
        nombre,
        clave,
        imgurl: imagenurl,
      })
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error("Error en ejecucion de query en crearZona de actions/zonas:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/zonas")

    // Return resultados
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en crearZona de actions/zonas:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar funcion crearZona de actions/zonas" }
  }
}

/*==================================================
  READS-OBTENER (SELECTS)
================================================== */
//Función: obtenerZonas: funcion para obtener todas las zonas
export async function obtenerZonas(
  id: number = -1,
  nombre: string = "",
  clave: string = "",
  activo: string = "Todos",
) {
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
      console.error("Error obteniendo zonas de query en obtenerZona de actions/zonas:", error)
      return { success: false, error: error.message }
    }

    // Paso 5: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerZona de actions/zonas:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar obtenerZonas de actions/zonas" }
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
