/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */

/* ==================================================
  Funciones
  --------------------
	* INSERTS
		- insXXXXX
	* SELECTS
		- selXXXXX
	* UPDATES
		- updXXXXX
	* DELETES
		- delXXXXX
	* SPECIALS
		- xxxXXXXX
================================================== */
//Función: selCatalogosXFiltros / obtenerCatalogosFiltrados: funcio que ejecuta el bloque de busqueda en la pagina de listado
export async function obtenerCatalogosFiltrados(
  nombre = "",
  clienteId = "-1",
  activo = true,
  page = 1,
  itemsPerPage = 20,
) {
  const supabase = createClient()

  try {
    let query = supabase
      .from("catalogos")
      .select(
        `
        id,
        nombre,
        descripcion,
        imgurl,
        activo,
        fechacreacion,
        cliente:clientes(
          id,
          nombre
        )
      `,
        { count: "exact" },
      )
      .eq("activo", activo)
      .ilike("nombre", `%${nombre}%`)

    if (clienteId !== "-1") {
      query = query.eq("clienteid", clienteId)
    }

    const { data, error, count } = await query
      .order("nombre", { ascending: true })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    if (error) throw error

    const mappedData = (data || []).map((catalogo) => ({
      id: String(catalogo.id),
      nombre: catalogo.nombre,
      descripcion: catalogo.descripcion,
      imgurl: catalogo.imgurl,
      activo: catalogo.activo,
      fechacreacion: catalogo.fechacreacion,
      cliente: catalogo.cliente
        ? {
            id: String(catalogo.cliente.id),
            nombre: catalogo.cliente.nombre,
          }
        : null,
    }))

    return {
      data: mappedData,
      count: count || 0,
      error: null,
    }
  } catch (error: any) {
    console.error("Error en obtenerCatalogosFiltrados:", error.message)
    return {
      data: [],
      count: 0,
      error: error.message,
    }
  }
}

//Función: selClientesDDL / obtenerClientesParaDropdown: función para obtener el listado para un dropdownlist
export async function obtenerClientesParaDropdown() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) throw error

    return {
      data: (data || []).map((cliente) => ({
        id: String(cliente.id),
        nombre: cliente.nombre,
      })),
      error: null,
    }
  } catch (error: any) {
    console.error("Error en obtenerClientesParaDropdown:", error.message)
    return {
      data: [],
      error: error.message,
    }
  }
}

//Función: selCatalogoXId / obtenerDetalleCatalogo: Función para obtener a detalle un catalogo pot Id
export async function obtenerDetalleCatalogo(catalogoId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("catalogos")
      .select(`
        id,
        nombre,
        descripcion,
        imgurl,
        activo,
        fechacreacion,
        cliente:clientes(
          id,
          nombre
        )
      `)
      .eq("id", catalogoId)
      .single()

    if (error) throw error

    const mappedData = {
      id: String(data.id),
      nombre: data.nombre,
      descripcion: data.descripcion,
      imgurl: data.imgurl,
      activo: data.activo,
      fechacreacion: data.fechacreacion,
      cliente: data.cliente
        ? {
            id: String(data.cliente.id),
            nombre: data.cliente.nombre,
          }
        : null,
    }

    return {
      catalogo: mappedData,
      error: null,
    }
  } catch (error: any) {
    console.error("Error en obtenerDetalleCatalogo:", error.message)
    return {
      catalogo: null,
      error: error.message,
    }
  }
}

//Función: listaDesplegableCatalogos: función para obtener el listado de catalogos para dropdownlist con filtros opcionales
export async function listaDesplegableCatalogos(id = -1, nombre = "", clienteid = -1) {
  const supabase = createClient()

  try {
    let query = supabase.from("catalogos").select("id, nombre").eq("activo", true)

    if (id > 0) {
      query = query.eq("id", id)
    }

    if (nombre && nombre !== "" && nombre !== null) {
      query = query.eq("nombre", nombre)
    }

    if (clienteid > 0) {
      query = query.eq("clienteid", clienteid)
    }

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) throw error

    return {
      data: (data || []).map((catalogo) => ({
        id: catalogo.id,
        nombre: catalogo.nombre,
      })),
      error: null,
    }
  } catch (error: any) {
    console.error("Error en listaDesplegableCatalogos:", error.message)
    return {
      data: [],
      error: error.message,
    }
  }
}
