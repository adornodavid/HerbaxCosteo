"use server"

/* ==================================================
  Imports
================================================== */
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
// Helper para crear el cliente Supabase con cookies
function createServerSupabaseClientWrapper(cookieStore: ReturnType<typeof cookies>) {
  return createServerComponentClient({ cookies: () => cookieStore })
}

/* ==================================================
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearCliente / insCliente
  * READS-OBTENER (SELECTS)
    - obtenerClientes / selClientes
    - obtenerClientesPorFiltros / selClientesXFiltros
    - obtenerClientePorId / selClienteXId
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarCliente / updCliente
  * DELETES-ELIMINAR (DELETES)
    - eliminarCliente / delCliente
  * SPECIALS-ESPECIALES ()
    - estatusActivoCliente / actCliente
    - listaDesplegableClientes / ddlClientes
================================================== */
//Función: crearCliente: funcion para crear un cliente

//Función: obtenerClientes: funcion para obtener todos los clientes

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
export async function listaDesplegableClientes(id = "-1", nombre = "") {
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
