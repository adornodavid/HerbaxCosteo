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

/*==================================================
  READS-OBTENER (SELECTS)
================================================== */
//Función: obtenerZonas: funcion para obtener todas las zonas
export async function obtenerZonas(
  id = -1,
  nombre = "",
  clave = "",
  direccion = "",
  telefono = "",
  email = ""
  activo = "Todos",
) {
  try {
    // Paso 1: Preparar Query
    let query = supabase.from("clientes").select(`
        id,
        nombre,
        clave,
        direccion,
        telefono,
        email,
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
    if (direccion !== "") {
      query = query.ilike("direccion", `%${direccion}%`)
    }
    if (telefono !== "") {
      query = query.ilike("telefono", `%${telefono}%`)
    }
    if (email !== "") {
      query = query.ilike("email", `%${email}%`)
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

    // Paso 3: Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Paso 4: Varaibles y resultados del query
    const { data, error } = await query

    // Error en query
    if (error) {
      console.error("Error obteniendo clientes en obtenerClientes de actions/clientes:", error)
      return { success: false, error: error.message }
    }

    // Paso 5: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en app/actions/clientes en obtenerClientes:", error)
    return { success: false, error: "Error interno del servidor" }
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
