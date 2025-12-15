/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import type { ddlItem } from "@/types/common.types"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

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
    - listaDesplegableCatalogos / ddlCatalogos
================================================== */
// Función: listaDesplegableUnidadesMedida: función que se utiliza para los dropdownlist y puede contener id y / o nombre
export async function listaDesplegableUnidadesMedida(id = -1, descripcion = "") {
  try {
    // Query principal
    let query = supabase.from("unidadesmedida").select("id, descripcion")

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("descripcion", `%${descripcion}%`)
    }

    // Ejecutar query
    query = query.order("descripcion", { ascending: true })

    // Varaibles y resultados del query
    const { data: unidades, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de unidades de medida:", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = unidades
      ? unidades.map((unidad) => ({
          value: unidad.id.toString(),
          text: unidad.descripcion,
        }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableUnidadesMedida:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableFormasFarmaceuticas: función que se utiliza para los dropdownlist y puede contener id y / o nombre
export async function listaDesplegableFormasFarmaceuticas(id = -1, nombre = "") {
  try {
    // Query principal
    let query = supabase.from("formasfarmaceuticas").select("id, nombre")

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }

    // Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Varaibles y resultados del query
    const { data: formas, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de formas farmacéuticas:", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = formas
      ? formas.map((forma) => ({
          value: forma.id.toString(),
          text: forma.nombre,
        }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableFormasFarmaceuticas:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableSistemas: función que se utiliza para los dropdownlist y puede contener id y / o nombre
export async function listaDesplegableSistemas(id = -1, nombre = "") {
  try {
    console.log("[v0] listaDesplegableSistemas called with:", { id, nombre })

    // Query principal
    let query = supabase.from("sistemas").select("id, nombre")

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }

    // Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Varaibles y resultados del query
    const { data: sistemas, error } = await query

    console.log("[v0] sistemas query result:", { sistemas, error })

    if (error) {
      console.error("Error obteniendo la lista desplegable de sistemas:", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = sistemas
      ? sistemas.map((sistema) => ({
          value: sistema.id.toString(),
          text: sistema.nombre,
        }))
      : []

    console.log("[v0] sistemas mapped data:", data)

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableSistemas:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableProductosTiposComisiones: función que se utiliza para los dropdownlist de tipos de comisiones de productos
export async function listaDesplegableProductosTiposComisiones(id = "", value = "") {
  try {
    // Query principal con DISTINCT
    let query = supabase.from("productos").select("categoria").not("categoria", "is", null)

    // Filtros en query, dependiendo parametros
    if (id !== "") {
      query = query.eq("categoria", `%${value}%`)
    }
    if (value !== "") {
      query = query.ilike("categoria", `%${value}%`)
    }

    // Ejecutar query
    const { data: categorias, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de tipos de comisiones de productos:", error)
      return { success: false, error: error.message }
    }

    // Obtener valores únicos (DISTINCT) y ordenar
    const categoriasUnicas = Array.from(new Set(categorias?.map((item) => item.categoria) || []))
      .filter((cat) => cat !== null && cat !== "")
      .sort()

    const data: ddlItem[] = [
      { value: "0", text: "n/a" },
      ...categoriasUnicas.map((categoria) => ({
        value: categoria,
        text: categoria,
      })),
    ]

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableProductosTiposComisiones:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableEnvase: función que se utiliza para los dropdownlist de envases de productos
export async function listaDesplegableEnvase(id = "", value = "") {
  try {
    // Query principal con DISTINCT
    let query = supabase.from("productos").select("envase").not("envase", "is", null)

    // Filtros en query, dependiendo parametros
    if (id !== "") {
      query = query.eq("envase", `%${value}%`)
    }
    if (value !== "") {
      query = query.ilike("envase", `%${value}%`)
    }

    // Ejecutar query
    const { data: envases, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de envases de productos:", error)
      return { success: false, error: error.message }
    }

    // Obtener valores únicos (DISTINCT) y ordenar
    const envasesUnicos = Array.from(new Set(envases?.map((item) => item.envase) || []))
      .filter((env) => env !== null && env !== "")
      .sort()

    const data: ddlItem[] = envasesUnicos.map((envase) => ({
      value: envase,
      text: envase,
    }))

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableEnvase:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableCatalogos: función para obtener el listado de catalogos para dropdownlist con filtros opcionales
export async function listaDesplegableCatalogos(id = -1, nombre = "", clienteid = -1) {
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

// Función: obtenerCatalogosFiltrados: función que ejecuta el bloque de búsqueda en la página de listado
export async function obtenerCatalogosFiltrados(
  nombre = "",
  clienteId = "-1",
  activo = true,
  page = 1,
  itemsPerPage = 20,
) {
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

// Función: obtenerClientesParaDropdown: función para obtener el listado para un dropdownlist
export async function obtenerClientesParaDropdown() {
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

// Función: obtenerDetalleCatalogo: Función para obtener a detalle un catálogo por Id
export async function obtenerDetalleCatalogo(catalogoId: string) {
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

// Función: obtenerProductosCatalogo: función para obtener productos relacionados a un catálogo
export async function obtenerProductosCatalogo(catalogoId: string) {
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

    // Aplanar los datos para obtener productos con precio de venta
    const productos = data.flatMap((catalogo) =>
      catalogo.productosxcatalogo.map((px) => ({
        ...px.productos,
        precioventa: px.precioventa,
      })),
    )

    return {
      data: productos.map((producto) => ({
        id: String(producto.id),
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        presentacion: producto.presentacion,
        imgurl: producto.imgurl,
        costo: producto.costo,
        precioventa: producto.precioventa, // Added precio venta to return data
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

// Función: obtenerProductosDisponiblesParaCatalogo: función para obtener productos disponibles del cliente para agregar al catálogo
export async function obtenerProductosDisponiblesParaCatalogo(catalogoId: string) {
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

// Función: asociarProductoACatalogo: función para asociar un producto a un catálogo
export async function asociarProductoACatalogo(
  catalogoId: string,
  productoId: string,
  precioVenta: number,
  costoProducto: number,
) {
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

// Función: crearCatalogo: función para crear un nuevo catálogo con imagen
export async function crearCatalogo(clienteId: string, nombre: string, descripcion: string, imageFile: File | null) {
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

// Función: eliminarProductoDeCatalogo: función para eliminar un producto de un catálogo
export async function eliminarProductoDeCatalogo(catalogoId: string, productoId: string) {
  try {
    const { error } = await supabase
      .from("productosxcatalogo")
      .delete()
      .eq("catalogoid", catalogoId)
      .eq("productoid", productoId)

    if (error) throw error

    return {
      success: true,
      error: null,
    }
  } catch (error: any) {
    console.error("Error en eliminarProductoDeCatalogo:", error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Función: actualizarPrecioProductoCatalogo: función para actualizar el precio de venta de un producto en un catálogo
export async function actualizarPrecioProductoCatalogo(
  catalogoId: string,
  productoId: string,
  nuevoPrecioVenta: number,
  costoProducto: number,
) {
  try {
    const nuevoMargenUtilidad = nuevoPrecioVenta - costoProducto

    const { error } = await supabase
      .from("productosxcatalogo")
      .update({
        precioventa: nuevoPrecioVenta,
        margenutilidad: nuevoMargenUtilidad,
      })
      .eq("catalogoid", catalogoId)
      .eq("productoid", productoId)

    if (error) throw error

    return {
      success: true,
      error: null,
    }
  } catch (error: any) {
    console.error("Error en actualizarPrecioProductoCatalogo:", error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
