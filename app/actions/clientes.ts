"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { imagenSubir } from "@/app/actions/utilerias"
import { cookies } from "next/headers"

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
    - objetoCliente / oCliente (Individual)
    - objetoClientes / oClientes (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearCliente / insCliente
  * READS-OBTENER (SELECTS)
    - obtenerClientes / selClientes
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarCliente / updCliente
  * DELETES-ELIMINAR (DELETES)
    - eliminarCliente / delCliente
  * SPECIALS-ESPECIALES ()
    - estatusActivoCliente / actCliente
    - listaDesplegableClientes / ddlClientes
    - estadisticasFormulas / statsFormlas
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */

/*==================================================
    CREATES-CREAR (INSERTS)
================================================== */
//Función: crearCliente: funcion para crear un cliente
export async function crearCliente(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const nombre = (formData.get("nombre") as string)?.trim()
    const clave = (formData.get("clave") as string)?.trim()
    const direccion = formData.get("direccion") as string
    const telefono = formData.get("telefono") as string
    const email = formData.get("email") as string
    const imagen = formData.get("imagen") as File
    const fecha = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
    const activo = true

    // Paso 2: Validar variables obligatorias
    if(!nombre || nombre.length < 3){
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerClientes(-1, nombre, clave, "", "", "", "Todos")
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()
    if (existe) {
      return { success: false, error: "El cliente que se intenta ingresar ya existe y no se puede proceder" }
    }

    // Paso 4: Subir imagen para obtener su url
    let imagenurl = ""   
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "clientes")
      if (resultadoImagen.success) {
        imagenurl = resultadoImagen.url || "" 
        if(imagenurl.length < 3){
          return { success: false, error: "Se subio la imagen a supabase pero no se obtuvo el url."}
        }
      }else{
        return { success: false, error: resultadoImagen.error }
      }
    }
    
    // Paso 5: Ejecutar Query
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre,
        clave,
        direccion,
        telefono,
        email,
        imgurl: imagenurl,
        fechacreacion: fecha,
        activo,
      })
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error("Error creando cliente en query en crearcliente de actions/clientes:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/clientes")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    // Retorno de información
    console.error("Error en crearCliente de actions/clientes:", error)
    return {
      success: false,
      mensaje: "Error interno del servidor, al ejecutar funcion crearCliente de actions/clientes: " + error,
    }
  }
}

/*==================================================
  READS-OBTENER (SELECTS)
================================================== */
//Función: obtenerClientes: funcion para obtener todos los clientes
export async function obtenerClientes(
  id = -1,
  nombre = "",
  clave = "",
  direccion = "",
  telefono = "",
  email = "",
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
      query = query.ilike("nombre", `%${nombre.trim()}%`)
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
      console.error("Error obteniendo clientes en query en obtenerClientes de actions/clientes:", error)
      return { success: false, error: error.message }
    }

    // Paso 5: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerClientes de actions/clientes:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar obtenerClientes de actions/clientes" }
  }
}

/*==================================================
  UPDATES-ACTUALIZAR (UPDATES)
================================================== */
//Función: actualizarCliente / updCliente: funcion para actualizar un cliente
export async function actualizarCliente(formData: FormData) {
  try {
    const idString = formData.get("id") as string
    const id = Number(idString)

    // Paso 1: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerClientes(
        -1,
        formData.get("nombre") as string,
        formData.get("clave") as string,
        "",
        "",
        "",
        "Todos",
      )
      if (resultado.success && resultado.data) {
        
      } 
    })()

    if (existe) {
      return {
        success: false,
        error:
          "Los datos del cliente que desea actualizar ya los tiene otro registro y no se puede proceder, recuerde que la información debe ser unica.",
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
//Función: eliminarCliente / delCliente: funcion para eliminar un cliente
export async function eliminarCliente(id: number) {
  try {
    // Paso 1: Validar que id tiene valor
    if (!id || id < 1) {
      return { success: false, error: "Error eliminando cliente en query en eliminarCliente de actions/clientes: No se obtuvo el id a eliminar" }
    }

    // Paso 2: Verificar que el cliente existe
    const { data: clienteExiste } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", id)
      .single()

    if (!clienteExiste) {
      return { success: false, error: "El cliente que intenta eliminar no existe" }
    }

    // Paso 3: Ejecutar Query DELETE
    const { error } = await supabase.from("clientes").delete().eq("id", id)
    // Return si hay error en query
    if (error) {
      console.error("Error eliminando cliente en query en eliminarCliente de actions/clientes:", error)
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/clientes")

    // Paso 4: Return resultados
    return { success: true, data: { id, message: "Cliente eliminado exitosamente" } }
  } catch (error) {
    console.error("Error en eliminarCliente de actions/clientes: " + error)
    // Return info
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion eliminarCliente de actions/clientes: " + error,
    }
  }
}

/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */
// Función: estatusActivoCliente / actCliente: Funcion que cambia la columna activo a true(activo) o false(inactivo)
export async function estatusActivoCliente(id: number, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from("clientes").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error(
        "Error actualizando estatus activo del cliente en estatusActivoCliente de app/actions/clientes:",
        error,
      )
      return false
    }

    revalidatePath("/clientes")
    return true
  } catch (error) {
    console.error("Error en estatusActivoCliente de app/actions/clientes: ", error)
    return false
  }
}



// Función: listaDesplegableClientes: función que se utiliza para los dropdownlist y puede contener id y / o nombre
export async function listaDesplegableClientes(id = -1, nombre = "", activo = "Todos") {
  try {
    // Query principal
    let query = supabase.from("clientes").select("id, nombre")

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
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

    // Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Varaibles y resultados del query
    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de clientes:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableClientes:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
export async function listaDesplegableClientes2(id = "-1", nombre = "") {
  const supabaseClient = createServerSupabaseClientWrapper(cookies())

  try {
    let supabaseQuery = supabaseClient.from("clientes").select("id, nombre").order("nombre", { ascending: true })

    if (nombre && nombre.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("nombre", `%${nombre}%`)
    }

    if (id !== "-1" && id !== "" && !isNaN(Number(id))) {
      supabaseQuery = supabaseQuery.eq("id", Number(id))
    }

    const { data, error } = await supabaseQuery

    if (error) {
      console.error("Error al obtener clientes para dropdown:", error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    console.error("Error en listaDesplegableClientes:", error)
    return { data: null, error: error.message }
  }
}
