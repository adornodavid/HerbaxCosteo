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

//Función: obtenerProductosCatalogo: función para obtener productos relacionados a un catálogo
export async function obtenerProductosCatalogo(catalogoId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("catalogos")
      .select(`
        productosxcatalogo!inner(
        precioventa,
          productos!inner(
            id,
            nombre,
            descripcion,
            presentacion,
            imgurl,
            costo
          )
        )
      `)
      .eq("id", catalogoId)
      .eq("productosxcatalogo.productos.activo", true)

    if (error) throw error

    // Aplanar los datos para obtener solo los productos
    const productos = data.flatMap((catalogo) => catalogo.productosxcatalogo.map((px) => px.productos))

    return {
      data: productos.map((producto) => ({
        id: String(producto.id),
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        presentacion: producto.presentacion,
        imgurl: producto.imgurl,
        costo: producto.costo,
        precioventa: producto.precioventa,
      })),
      error: null,
    }
  } catch (error: any) {
    console.error("Error en obtenerProductosCatalogo:", error.message)
    return {
      data: [],
      error: error.message,
    }
  }
}

//Función: obtenerProductosDisponiblesParaCatalogo: función para obtener productos disponibles del cliente para agregar al catálogo
export async function obtenerProductosDisponiblesParaCatalogo(catalogoId: string) {
  const supabase = createClient()

  try {
    // Primero obtenemos los productos del cliente relacionado al catálogo
    const { data: catalogoData, error: catalogoError } = await supabase
      .from("catalogos")
      .select(`
        clientes!inner(
          productos!inner(
            id,
            nombre,
            descripcion,
            presentacion,
            imgurl,
            costo
          )
        )
      `)
      .eq("id", catalogoId)
      .eq("clientes.productos.activo", true)

    if (catalogoError) throw catalogoError

    // Obtenemos los productos ya asociados al catálogo
    const { data: productosAsociados, error: asociadosError } = await supabase
      .from("productosxcatalogo")
      .select("productoid")
      .eq("catalogoid", catalogoId)

    if (asociadosError) throw asociadosError

    const idsAsociados = productosAsociados.map((p) => p.productoid)

    // Aplanar los productos del cliente
    const todosProductos = catalogoData.flatMap((catalogo) => catalogo.clientes.productos)

    // Filtrar productos que no estén ya asociados
    const productosDisponibles = todosProductos.filter((producto) => !idsAsociados.includes(producto.id))

    return {
      data: productosDisponibles.map((producto) => ({
        id: String(producto.id),
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        presentacion: producto.presentacion,
        imgurl: producto.imgurl,
        costo: producto.costo,
      })),
      error: null,
    }
  } catch (error: any) {
    console.error("Error en obtenerProductosDisponiblesParaCatalogo:", error.message)
    return {
      data: [],
      error: error.message,
    }
  }
}

//Función: asociarProductoACatalogo: función para asociar un producto a un catálogo
export async function asociarProductoACatalogo(
  catalogoId: string,
  productoId: string,
  precioVenta: number,
  costoProducto: number,
) {
  const supabase = createClient()

  try {
    const margenUtilidad = precioVenta - costoProducto
    const fechaHoy = new Date().toISOString()

    const { data, error } = await supabase.from("productosxcatalogo").insert({
      catalogoid: catalogoId,
      productoid: productoId,
      precioventa: precioVenta,
      margenutilidad: margenUtilidad,
      fechacreacion: fechaHoy,
      activo: true,
    })

    if (error) throw error

    return {
      success: true,
      error: null,
    }
  } catch (error: any) {
    console.error("Error en asociarProductoACatalogo:", error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}

//Función: crearCatalogo: función para crear un nuevo catálogo con imagen
export async function crearCatalogo(clienteId: string, nombre: string, descripcion: string, imageFile: File | null) {
  const supabase = createClient()

  try {
    let imgUrl = null

    // Si hay una imagen, subirla al bucket
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `herbax/catalogos/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("herbax")
        .upload(`catalogos/${fileName}`, imageFile)

      if (uploadError) throw uploadError

      // Obtener la URL pública de la imagen
      const { data: urlData } = supabase.storage.from("herbax").getPublicUrl(`catalogos/${fileName}`)

      imgUrl = urlData.publicUrl
    }

    // Insertar el catálogo en la base de datos
    const { data, error } = await supabase
      .from("catalogos")
      .insert({
        clienteid: clienteId,
        nombre: nombre,
        descripcion: descripcion,
        imgurl: imgUrl,
        fechacreacion: new Date().toISOString(),
        activo: true,
      })
      .select()

    if (error) throw error

    return {
      success: true,
      data: data[0],
      error: null,
    }
  } catch (error: any) {
    console.error("Error en crearCatalogo:", error.message)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}
