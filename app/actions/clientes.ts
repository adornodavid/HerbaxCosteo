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
    // Paso 1: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerClientes(
        -1,
        formData.get("nombre") as string,
        formData.get("clave") as string,
        //Number.parseInt(formData.get("clienteid") as string),
        "",
        "",
        "",
        "Todos",
      )
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()

    if (existe) {
      return { success: false, error: "El cliente que se intenta ingresar ya existe y no se puede proceder" }
    }

    // Paso 2: Subir imagen para obtener su url
    let imagenurl = ""
    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, formData.get("nombre") as string, "clientes")
      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error || "Error al subir la imagen" }
      }
      imagenurl = resultadoImagen.url || ""
    }

    // Paso 3: Pasar datos del formData a variables con tipado de datos
    const nombre = formData.get("nombre") as string
    const clave = formData.get("clave") as string
    const direccion = formData.get("direccion") as string
    const telefono = formData.get("telefono") as string
    const email = formData.get("email") as string
    const fecha = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
    const activo = true

    // Paso 4: Ejecutar Query
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

    // Return resultados
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en crearCliente de actions/clientes:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar funcion crearCliente de actions/clientes" }
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

/*==================================================
  * DELETES-ELIMINAR (DELETES)
================================================== */


/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */






//Función: obtenerClientesPorFiltros: funcion para obtener todos los clientes por el filtrado
//Funcion: obtenerClientesFiltrados
export async function obtenerClientesFiltrados(nombre = "", page = 1, limit = 20) {
  const supabase = createServerSupabaseClientWrapper(cookies())
  const offset = (page - 1) * limit

  try {
    let supabaseQuery = supabase
      .from("clientes") // Cambiado de 'hoteles' a 'clientes'
      .select("id, nombre, direccion, imgurl, activo", { count: "exact" }) // Ajustado para columnas de clientes
      .order("nombre", { ascending: true })

    // Solo aplicar filtro de nombre si tiene valor (no está vacío)
    if (nombre && nombre.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("nombre", `%${nombre}%`)
    }

    const { data: queryData, error: queryError, count } = await supabaseQuery.range(offset, offset + limit - 1)

    if (queryError) {
      console.error("Error al obtener clientes:", queryError)
      return { data: null, error: queryError.message, totalCount: 0 }
    }

    // Mapear los datos para que coincidan con el tipo ClienteResult
    const mappedData =
      queryData?.map((cliente) => ({
        Folio: cliente.id,
        Nombre: cliente.nombre,
        Direccion: cliente.direccion,
        ImgUrl: cliente.imgurl,
        Estatus: cliente.activo,
      })) || []

    return { data: mappedData, error: null, totalCount: count || 0 }
  } catch (error: any) {
    console.error("Error en obtenerClientesFiltrados:", error)
    return { data: null, error: error.message, totalCount: 0 }
  }
}

//Función: obtenerClientePorId: funcion para obtener el cliente por Id del cliente

//Funcion: obtenerTotalClientes
export async function obtenerTotalClientes() {
  const supabase = createServerSupabaseClientWrapper(cookies())
  try {
    const { count, error } = await supabase.from("clientes").select("*", { count: "exact", head: true }) 
    if (error) {
      console.error("Error al obtener total de clientes:", error)
      return { total: 0, error: error.message }
    }

    return { total: count || 0, error: null }
  } catch (error: any) {
    console.error("Error en obtenerTotalClientes:", error)
    return { total: 0, error: error.message }
  }
}

// Función: listaDesplegableClientes: función que se utiliza para los dropdownlist y puede contener id y / o nombre
export async function listaDesplegableClientes(id = -1, nombre = "", activo = "Todos") {
  try {
    // Query principal
    let query = supabase.from("clientes").select("id, nombre")

    //Filtros en query, dependiendo parametros
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

    //Ejecutar query
    query = query.order("nombre", { ascending: true })

    //Varaibles y resultados del query
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
  const supabase = createServerSupabaseClientWrapper(cookies())

  try {
    let supabaseQuery = supabase.from("clientes").select("id, nombre").order("nombre", { ascending: true })

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

// Nota: Las funciones de crear, actualizar y eliminar no fueron solicitadas para clientes-actions.ts,
// pero si las necesitas en el futuro, se adaptarían de manera similar a las de hoteles-actions.ts.
