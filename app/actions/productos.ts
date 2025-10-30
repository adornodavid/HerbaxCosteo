"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { ddlItem } from "@/types/common.types"
import type { oProducto } from "@/types/productos.types"
import { imagenSubir } from "@/app/actions/utilerias"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabaseAdmin variable
const supabase = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

/* ==================================================
  --------------------
  Objetos / Clases
  --------------------
  * Objetos
    - objetoProducto / oProducto (Individual)
    - objetoProductos / oProductos (Listado / Array)
    - objetoProductoXCliente / oProductoXCliente (Individual)
    - objetoProductosXClientes / oProductosXCliente (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearProducto / insProducto
    - crearProductoCaracteristicas / insProductoCaracteristicas
    - crearProductoXCatalogo / insProductoXCatalogo

  * SELECTS: READ/OBTENER/SELECT
    - obtenerProductos / selProductos
    - obtenerProductosCaracteristicas / selProductosCaracteristicas
    - obtenerProductosXCatalogos / selProductosXCatalogos
    - obtenerProductosXClientes / selProductosXClientes
    
  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarProducto / updProducto
    - actualizarProductoCaracteristicas / updProductoCaracteristicas
    - actualizarProductoXCatalogo / updProductoXCatalogo
    - actualizarCosteoProducto

    x actualizarProductoEtapa1
    x actualizarCostoProducto
    x finalizarProducto (actualizar costo de producto)

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarProducto / delProducto
    - eliminarProductoCaracteristicas / delProductoCaracteristicas
    - eliminarProductoXCatalogo / delProductoXCatalogo

    x eliminarProductoIncompleto

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoProducto / actProducto
    - listaDesplegableProductos / ddlProductos
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoProducto / oProducto (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoProducto(
  productoid = -1,
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  catalogoid = -1,
  activo = "Todos",
): Promise<{ success: boolean; data?: oProducto; error?: string }> {
  try {
    const resultado = await obtenerProductos(productoid, productonombre, clienteid, zonaid, catalogoid, activo)

    if (!resultado.success || !resultado.data) {
      return { success: false, error: resultado.error || "No se encontraron datos" }
    }

    if (resultado.data.length === 0) {
      return { success: false, error: "Producto no encontrado" }
    }

    const producto: oProducto = resultado.data[0] as oProducto

    return { success: true, data: producto }
  } catch (error) {
    console.error("Error en app/actions/productos en objetoProducto (Individual):", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: objetoProductos / oProductos (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoProductos(
  productoid = -1,
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  catalogoid = -1,
  activo = "Todos",
): Promise<{ success: boolean; data?: oProducto[]; error?: string }> {
  try {
    const resultado = await obtenerProductos(productoid, productonombre, clienteid, zonaid, catalogoid, activo)

    if (!resultado.success || !resultado.data) {
      return { success: false, error: resultado.error || "No se encontraron datos" }
    }

    const productos: oProducto[] = resultado.data as oProducto[]

    return { success: true, data: productos }
  } catch (error) {
    console.error("Error en app/actions/productos en objetoProductos (Listado/Array):", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearProducto / insProducto: función para insertar (Información basica)
export async function crearProducto(formData: FormData) {
  try {
    //Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerProductos(
        -1,
        formData.get("nombre") as string,
        Number.parseInt(formData.get("clienteid") as string),
        Number.parseInt(formData.get("zonaid") as string) || -1,
        -1,
        "Todos",
      )
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()

    if (existe) {
      return { success: false, error: "El producto que se intenta ingresar ya existe y no se puede proceder" }
    }

    //Subir imagen para obtener su url
    let imagenurl = ""
    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, formData.get("nombre") as string, "productos")

      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error || "Error al subir la imagen" }
      }

      imagenurl = resultadoImagen.url || ""
    }

    //Pasar datos del formData a variables con tipado de datos
    const codigo = formData.get("codigo") as string
    const clienteid = Number.parseInt(formData.get("clienteid") as string)
    const zonaid = Number.parseInt(formData.get("zonaid") as string) || null
    const nombre = formData.get("nombre") as string
    const unidadmedidaid = Number.parseInt(formData.get("unidadmedidaid") as string) || null
    const costo = 0.0
    const fecha = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
    const activo = true

    //Ejecutar Query
    const { data, error } = await supabase
      .from("productos")
      .insert({
        codigo,
        clienteid,
        zonaid,
        nombre,
        unidadmedidaid,
        costo,
        imgurl: imagenurl,
        fechacreacion: fecha,
        activo,
      })
      .select("id")
      .single()

    //Return error
    if (error) {
      console.error("Error creando producto en app/Actions/productos en crearProducto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos")

    //Return resultados
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en actions/productos en crearProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: crearProductoCaracteristicas / insProductoCaracteristicas: Función para crear las caracteristicas de un producto (Información secundaria)
export async function crearProductoCaracteristicas(productoid: number): Promise<boolean> {
  try {
    const { error } = await supabase.from("productoscaracteristicas").insert({
      productoid,
      descripcion: null,
      presentacion: null,
      porcion: null,
      modouso: null,
      porcionenvase: null,
      categoriauso: null,
      propositoprincipal: null,
      propuestavalor: null,
      instruccionesingesta: null,
      edadminima: null,
      advertencia: null,
      condicionesalmacenamiento: null,
    })

    if (error) {
      console.error(
        "Error creando características del producto en app/actions/productos en crearProductoCaracteristicas:",
        error,
      )
      return false
    }

    revalidatePath("/productos")
    return true
  } catch (error) {
    console.error("Error en app/actions/productos en crearProductoCaracteristicas:", error)
    return false
  }
}

// Función: crearProductoXCatalogo / insProductoXCatalogo: función para crear la relacion de un producto con un catalogo
export async function crearProductoXCatalogo(
  productoid: number,
  catalogoid: number,
  precioventa: number,
  margenutilidad: number,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("productosxcatalogo").insert({
      productoid,
      catalogoid,
      precioventa,
      margenutilidad,
      fechacreacion: new Date().toISOString(),
      activo: true,
    })

    if (error) {
      console.error(
        "Error creando relación producto-catálogo en app/actions/productos en crearProductoXCatalogo:",
        error,
      )
      return false
    }

    revalidatePath("/productos")
    return true
  } catch (error) {
    console.error("Error en app/actions/productos en crearProductoXCatalogo:", error)
    return false
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Funcion: obtenerProductos / selProductos: Funcion para obtener
export async function obtenerProductos(
  productoid = -1,
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  catalogoid = -1,
  activo = "Todos",
) {
  try {
    let Ids: number[] = []
    if (catalogoid > 0) {
      const resultado = await obtenerProductosXCatalogos(catalogoid)
      if (resultado.success && resultado.data) {
        Ids = resultado.data
      }
    }

    let query = supabase.from("productos").select(`
        id,
        codigo,
        clienteid,
        clientes!clienteid(nombre),
        zonaid,
        zonas!zonaid(nombre),
        nombre,
        imgurl,
        unidadmedidaid,
        unidadesmedida!unidadmedidaid(descripcion),
        mp,
        me,
        ms,
        costo,
        mp_porcentaje,
        me_porcentaje,
        ms_porcentaje,
        mp_costeado,
        me_costeado,
        ms_costeado,
        preciohl,
        utilidadhl,
        forecasthl,
        activo,
        productoscaracteristicas!productoid(
          descripcion,
          presentacion,
          porcion,
          modouso,
          porcionenvase,
          categoriauso,
          propositoprincipal,
          propuestavalor,
          instruccionesingesta,
          edadminima,
          advertencia,
          condicionesalmacenamiento
        ),
        materialesetiquetadoxproducto!productoid(
          materialetiquetadoid,
          materialesetiquetado!materialetiquetadoid(
            codigo,
            nombre,
            imgurl,
            unidadmedidaid,
            unidadesmedida!unidadmedidaid(descripcion),
            costo
          ),
          cantidad,
          costoparcial
        ),
        formulasxproducto!productoid(
          formulaid,
          formulas!formulaid(
            codigo,
            nombre,
            unidadmedidaid,
            unidadesmedida!unidadmedidaid(descripcion),
            costo,
            materiasprimasxformula!formulaid(
              materiaprimaid,
              cantidad,
              costoparcial,
              materiasprima!materiaprimaid(
                codigo, 
                nombre,
                unidadmedidaid,
                unidadesmedida!unidadmedidaid(descripcion),
                costo
              )
            ),
            formulasxformula!formulaid(
              secundariaid,
              cantidad,
              costoparcial,
              formulas!secundariaid(
                codigo, 
                nombre,
                unidadmedidaid,
                unidadesmedida!unidadmedidaid(descripcion),
                costo
              )
            )
          ),
          cantidad,
          costoparcial
        )
      `)

    //Filtros en query, dependiendo parametros
    if (productoid !== -1) {
      query = query.eq("id", productoid)
    }

    if (clienteid !== -1) {
      query = query.eq("clienteid", clienteid)
    }
    if (zonaid !== -1) {
      query = query.eq("zonaid", zonaid)
    }
    if (productonombre !== "") {
      query = query.ilike("nombre", `%${productonombre}%`)
    }
    if (catalogoid > 0) {
      query = query.in("id", Ids)
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

    //Error en query
    if (error) {
      console.error("Error obteniendo productos:", error)
      return { success: false, error: error.message }
    }

    //Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en app/actions/productos en obtenerProductos:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Funcion: obtenerProductosCaracteristicas / selProductosCaracteristicas: Funcion para obtener las características de un producto
export async function obtenerProductosCaracteristicas(
  idrec = -1,
  productoid = -1,
  descripcion = "",
  presentacion = "",
  porcion = "",
  modouso = "",
  porcionenvase = "",
  categoriauso = "",
  propositoprincipal = "",
  propuestavalor = "",
  instruccionesingesta = "",
  edadminima = -1,
  advertencia = "",
  condicionesalmacenamiento = "",
) {
  try {
    let query = supabase.from("productoscaracteristicas").select("*")

    if (idrec !== -1) {
      query = query.eq("id", idrec)
    }

    if (productoid !== -1) {
      query = query.eq("productoid", productoid)
    }

    if (descripcion !== "") {
      query = query.eq("descripcion", descripcion)
    }

    if (presentacion !== "") {
      query = query.eq("presentacion", presentacion)
    }

    if (porcion !== "") {
      query = query.eq("porcion", porcion)
    }

    if (modouso !== "") {
      query = query.eq("modouso", modouso)
    }

    if (porcionenvase !== "") {
      query = query.eq("porcionenvase", porcionenvase)
    }

    if (categoriauso !== "") {
      query = query.eq("categoriauso", categoriauso)
    }

    if (propositoprincipal !== "") {
      query = query.eq("propositoprincipal", propositoprincipal)
    }

    if (propuestavalor !== "") {
      query = query.eq("propuestavalor", propuestavalor)
    }

    if (instruccionesingesta !== "") {
      query = query.eq("instruccionesingesta", instruccionesingesta)
    }

    if (edadminima !== -1) {
      query = query.eq("edadminima", edadminima)
    }

    if (advertencia !== "") {
      query = query.eq("advertencia", advertencia)
    }

    if (condicionesalmacenamiento !== "") {
      query = query.eq("condicionesalmacenamiento", condicionesalmacenamiento)
    }

    const { data, error } = await query

    if (error) {
      console.error(
        "Error obteniendo características de productos en app/actions/productos en obtenerProductosCaracteristicas:",
        error,
      )
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en app/actions/productos en obtenerProductosCaracteristicas:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerProductosXCatalogos / selProductosXCatalogos: Funcion para obtener en un array el listado de los ids de productos
export async function obtenerProductosXCatalogos(
  catalogoid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (catalogoid <= 0) {
      return { success: false, error: "ID de catálogo inválido" }
    }

    const { data, error } = await supabase.from("productosxcatalogo").select("productoid").eq("catalogoid", catalogoid)

    if (error) {
      console.error("Error en query obtenerProductosXCatalogos:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.productoid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerProductosXCatalogos:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerProductosXClientes / selProductosXClientes: Función para obtener array de los ids de productos
export async function obtenerProductosXClientes(
  clienteid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (clienteid <= 0) {
      return { success: false, error: "ID de cliente inválido" }
    }

    //const { data, error } = await supabase.from("productos").select("productoid").eq("clienteid", clienteid)
    const { data, error } = await supabase
      .from("productos")
      .selectselect(`
        idrec,
        clienteid,
        clientes!clienteid(nombre),
        productoid,
        productos!productoid(
          codigo,
          nombre,
          mp,
          me,
          ms,
          costo,
          mp_porcentaje,
          me_porcentaje,
          ms_porcentaje,
          mp_costeado,
          me_costeado,
          ms_costeado,
          preciohl,
          utilidadhl
        ),
        categoria,
        forecast,
        precioventasiniva,
        precioventaconiva,
        preciohl,
        plangeneracional,
        plannivel,
        planinfinito,
        ivapagado,
        cda,
        bonoiniciorapido,
        constructoriniciorapido,
        rutaexito,
        reembolsos,
        tarjetacredito,
        envio,
        porcentajecosto,
        totalcosto,
        utilidadmarginal,
        precioactualporcentajeutilidad,        
        fechacreacion,
        fechamodificacion,
        activo,
        costoanual,
        utilidadanual,
        costoutilidadanual,
        precioventaconivaaa,
        preciopublicoconiva,
        preciopublicosiniva
      `)
      .eq("clienteid", clienteid)

    if (error) {
      console.error("Error en query obtenerProductosXClientes de actions/productos:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.productoid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerProductosXClientes de actions/productos:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerProductosXClientes de actions/productos",
    }
  }
}

// Funcion: obtenerProductos / selProductos: Funcion para obtener
export async function obtenerProductosXClientesOptima(productoid = -1, clienteid = -1) {
  try {
    let query = supabase.from("productosxcliente").select(`
        idrec,
        clienteid,
        clientes!clienteid(nombre),
        productoid,
        productos!productoid(
          codigo,
          nombre,
          mp,
          me,
          ms,
          costo,
          mp_porcentaje,
          me_porcentaje,
          ms_porcentaje,
          mp_costeado,
          me_costeado,
          ms_costeado,
          preciohl,
          utilidadhl
        ),
        utilidadoptima,
        comisiones_porcentaje,
        costo_porcentaje,
        comisionesmascosto,
        preciometa,
        preciometaconiva,
        diferenciautilidadesperada,
        precioventaconivaaa
      `)

    //Filtros en query, dependiendo parametros
    if (productoid !== -1) {
      query = query.eq("productoid", productoid)
    }
    if (clienteid !== -1) {
      query = query.eq("clienteid", clienteid)
    }

    //Ejecutar query
    query = query.order("productoid", { ascending: true })

    //Varaibles y resultados del query
    const { data, error } = await query

    //Error en query
    if (error) {
      console.error("Error obteniendo productos:", error)
      return { success: false, error: error.message }
    }

    //Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en app/actions/productos en obtenerProductos:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerProductosXClientes / selProductosXClientes: Función para obtener array de los ids de productos
export async function obtenerProductosXClientesArray(
  clienteid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (clienteid <= 0) {
      return { success: false, error: "ID de cliente inválido" }
    }

    const { data, error } = await supabase.from("productos").select("productoid").eq("clienteid", clienteid)

    if (error) {
      console.error("Error en query obtenerProductosXClientes de actions/productos:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.productoid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerProductosXClientes de actions/productos:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerProductosXClientes de actions/productos",
    }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Funcion: actualizarProducto / updProducto: Función para actualizar
export async function actualizarProducto(formData: FormData) {
  try {
    const productoid = Number.parseInt(formData.get("productoid") as string)

    if (!productoid || productoid <= 0) {
      return {
        success: false,
        message: "no se recibio el productoid a actualizar",
      }
    }

    const updateData: any = {}

    if (formData.get("codigo")) updateData.codigo = formData.get("codigo") as string
    if (formData.get("nombre")) updateData.nombre = formData.get("nombre") as string
    if (formData.get("clienteid")) updateData.clienteid = Number.parseInt(formData.get("clienteid") as string)
    if (formData.get("zonaid")) updateData.zonaid = Number.parseInt(formData.get("zonaid") as string)
    if (formData.get("unidadmedidaid"))
      updateData.unidadmedidaid = Number.parseInt(formData.get("unidadmedidaid") as string)
    if (formData.get("costo")) updateData.costo = Number.parseFloat(formData.get("costo") as string)
    if (formData.get("activo") !== null) updateData.activo = formData.get("activo") === "true"

    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, formData.get("nombre") as string, "productos")

      if (resultadoImagen.success && resultadoImagen.url) {
        updateData.imgurl = resultadoImagen.url
      }
    }

    updateData.fechaactualizacion = new Date().toISOString()

    const { error } = await supabase.from("productos").update(updateData).eq("id", productoid)

    if (error) {
      console.error("Error actualizando producto en app/actions/productos en actualizarProducto:", error)
      return {
        success: false,
        message: error.message,
      }
    }

    revalidatePath("/productos")
    return {
      success: true,
      message: "se actualizo correctamente",
    }
  } catch (error) {
    console.error("Error en app/actions/productos en actualizarProducto:", error)
    return {
      success: false,
      message: "Error interno del servidor",
    }
  }
}

// Función: actualizarProductoCaracteristicas / updProductoCaracteristicas: Actualizar características de un producto
export async function actualizarProductoCaracteristicas(
  productoid: number,
  caracteristicasData: any,
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("productoscaracteristicas")
      .update(caracteristicasData)
      .eq("productoid", productoid)

    if (error) {
      console.error("Error actualizando características del producto:", error)
      return false
    }

    revalidatePath("/productos")
    return true
  } catch (error) {
    console.error("Error en actualizarProductoCaracteristicas:", error)
    return false
  }
}

//Función: actualizarProductoXCatalogo / updProductoXCatalogo: Actualizar relación de un producto con un catálogo
export async function actualizarProductoXCatalogo(
  productoid: number,
  catalogoid: number,
  precioventa: number,
  margenutilidad: number,
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("productosxcatalogo")
      .update({
        precioventa,
        margenutilidad,
        fechaactualizacion: new Date().toISOString(),
      })
      .eq("productoid", productoid)
      .eq("catalogoid", catalogoid)

    if (error) {
      console.error("Error actualizando relación producto-catálogo:", error)
      return false
    }

    revalidatePath("/productos")
    return true
  } catch (error) {
    console.error("Error en actualizarProductoXCatalogo:", error)
    return false
  }
}

// Función: actualizarCosteoProducto: función para actualizar el costeo de un producto
export async function actualizarCosteoProducto(
  productosid: number,
  clientesid: number,
  preciosiniva: number,
  forecasts: number,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("actualizarcotizacion", {
      productosid,
      clientesid,
      preciosiniva,
      forecasts,
    })

    if (error) {
      console.error("Error actualizando costeo del producto en actualizarCosteoProducto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/costear")
    return { success: true, data }
  } catch (error) {
    console.error("Error en app/actions/productos en actualizarCosteoProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarProducto / delProducto: Función para eliminar (Filtro indispensable: productoid)
export async function eliminarProducto(productoid: number): Promise<boolean> {
  try {
    if (productoid <= 0) {
      console.error("Error en eliminarProducto: productoid debe ser mayor a 0")
      return false
    }

    const { error } = await supabase.from("productos").delete().eq("id", productoid)

    if (error) {
      console.error("Error eliminando producto en app/actions/productos en eliminarProducto:", error)
      return false
    }

    revalidatePath("/productos")
    return true
  } catch (error) {
    console.error("Error en app/actions/productos en eliminarProducto:", error)
    return false
  }
}

// Función: eliminarProductoCaracteristicas / delProductoCaracteristicas: Eliminar registro por productoid
export async function eliminarProductoCaracteristicas(productoid: number): Promise<boolean> {
  try {
    if (productoid <= 0) {
      console.error("Error en eliminarProductoCaracteristicas: productoid debe ser mayor a 0")
      return false
    }

    const { error } = await supabase.from("productoscaracteristicas").delete().eq("productoid", productoid)

    if (error) {
      console.error(
        "Error eliminando características del producto en app/actions/productos en eliminarProductoCaracteristicas:",
        error,
      )
      return false
    }

    revalidatePath("/productos")
    return true
  } catch (error) {
    console.error("Error en app/actions/productos en eliminarProductoCaracteristicas:", error)
    return false
  }
}

// Función: eliminarProductoXCatalogo / delProductoXCatalogo: Eliminar registro por productoid y catalogoid
export async function eliminarProductoXCatalogo(productoid: number, catalogoid: number): Promise<boolean> {
  try {
    if (productoid <= 0 || catalogoid <= 0) {
      console.error("Error en eliminarProductoXCatalogo: productoid y catalogoid deben ser mayores a 0")
      return false
    }

    const { error } = await supabase
      .from("productosxcatalogo")
      .delete()
      .eq("productoid", productoid)
      .eq("catalogoid", catalogoid)

    if (error) {
      console.error(
        "Error eliminando relación producto-catálogo en app/actions/productos en eliminarProductoXCatalogo:",
        error,
      )
      return false
    }

    revalidatePath("/productos")
    return true
  } catch (error) {
    console.error("Error en app/actions/productos en eliminarProductoXCatalogo:", error)
    return false
  }
}

// XXXXXXXXXXXXXX Función: eliminarProductoIncompleto: función para eliminar un producto incompleto y sus detalles
export async function eliminarProductoIncompleto(productoId: number) {
  try {
    // First, get the product info to delete the image if it exists
    const { data: producto, error: productoError } = await supabaseAdmin
      .from("productos")
      .select("imgurl")
      .eq("id", productoId)
      .single()

    if (productoError && productoError.code !== "PGRST116") {
      console.error("Error obteniendo producto para eliminar:", productoError)
      return { success: false, error: productoError.message }
    }

    // Delete image from storage if it exists
    if (producto?.imgurl) {
      try {
        // Extract filename from URL
        const urlParts = producto.imgurl.split("/")
        const fileName = urlParts[urlParts.length - 1]

        if (fileName && urlParts.includes("productos")) {
          const filePath = `productos/${fileName}`

          const { error: deleteImageError } = await supabaseAdmin.storage.from("herbax").remove([filePath])

          if (deleteImageError) {
            console.error("Error eliminando imagen:", deleteImageError)
            // Continue with deletion even if image deletion fails
          }
        }
      } catch (imageError) {
        console.error("Error procesando eliminación de imagen:", imageError)
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete from productosdetalles first (foreign key constraint)
    const { error: detallesError } = await supabaseAdmin.from("productosdetalles").delete().eq("productoid", productoId)

    if (detallesError) {
      console.error("Error eliminando detalles del producto:", detallesError)
      return { success: false, error: detallesError.message }
    }

    // Delete from productos table
    const { error: productoDeleteError } = await supabaseAdmin.from("productos").delete().eq("id", productoId)

    if (productoDeleteError) {
      console.error("Error eliminando producto:", productoDeleteError)
      return { success: false, error: productoDeleteError.message }
    }

    revalidatePath("/productos")
    return { success: true }
  } catch (error) {
    console.error("Error en eliminarProductoIncompleto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerCostoTotalProducto: función para obtener el costo total de un producto
export async function obtenerCostoTotalProducto(productoId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productosdetalles")
      .select("costoparcial")
      .eq("productoid", productoId)

    if (error) {
      console.error("Error obteniendo costo total del producto:", error)
      return { success: false, error: error.message, total: 0 }
    }

    // Calculate the sum of all costoparcial values
    const total = data?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0

    return { success: true, total }
  } catch (error) {
    console.error("Error en obtenerCostoTotalProducto:", error)
    return { success: false, error: "Error interno del servidor", total: 0 }
  }
}

// Función: finalizarProducto: función para finalizar un producto con insert a productoxcatalogo y update de costo
export async function finalizarProducto(productoId: number, catalogoId: number) {
  try {
    // First, get the total cost of the product
    const costoResult = await obtenerCostoTotalProducto(productoId)
    if (!costoResult.success) {
      return { success: false, error: "Error obteniendo costo total del producto" }
    }

    // Insert into productoxcatalogo
    const { error: insertError } = await supabaseAdmin.from("productosxcatalogo").insert({
      catalogoid: catalogoId,
      productoid: productoId,
      precioventa: null,
      margenutilidad: null,
      fechacreacion: new Date().toISOString(),
      activo: true,
    })

    if (insertError) {
      console.error("Error insertando en productosxcatalogo:", insertError)
      return { success: false, error: insertError.message }
    }

    // Update productos table with the total cost
    const { error: updateError } = await supabaseAdmin
      .from("productos")
      .update({
        costo: costoResult.total,
      })
      .eq("id", productoId)

    if (updateError) {
      console.error("Error actualizando costo del producto:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/productos")
    return { success: true }
  } catch (error) {
    console.error("Error en finalizarProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: actualizarCostoProducto: función para actualizar solo el costo de un producto
export async function actualizarCostoProducto(productoId: number) {
  try {
    // Get the total cost of the product
    const costoResult = await obtenerCostoTotalProducto(productoId)
    if (!costoResult.success) {
      return { success: false, error: "Error obteniendo costo total del producto" }
    }

    // Update productos table with the total cost
    const { error: updateError } = await supabaseAdmin
      .from("productos")
      .update({
        costo: costoResult.total,
      })
      .eq("id", productoId)

    if (updateError) {
      console.error("Error actualizando costo del producto:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/productos")
    return { success: true }
  } catch (error) {
    console.error("Error en actualizarCostoProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */
// Función: estatusActivoProducto / actProducto: Funcion que cambia la columna activo a true(activo) o false(inactivo) del producto
export async function estatusActivoProducto(productoid: number, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from("productos").update({ activo: activo }).eq("id", productoid)

    if (error) {
      console.error(
        "Error actualizando estatus activo del producto en app/actions/productos en estatusActivoProducto:",
        error,
      )
      return false
    }

    revalidatePath("/productos")
    return true
  } catch (error) {
    console.error("Error en app/actions/productos en estatusActivoProducto:", error)
    return false
  }
}

// Función: listaDesplegableProductos / ddlProductos: Lista desplegable de productos para agregar
export async function listaDesplegableProductosBuscar(buscar: string): Promise<ddlItem[]> {
  try {
    let query = supabase.from("productos").select("id, codigo, nombre").eq("activo", true)

    // Apply filter: search in nombre OR codigo
    if (buscar && buscar.trim() !== "") {
      query = query.or(`nombre.ilike.%${buscar}%,codigo.ilike.%${buscar}%`)
    }

    // Order by nombre
    query = query.order("nombre", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo lista desplegable de productos:", error)
      return []
    }

    // Map results to ddlItem format: value = id, text = "codigo - nombre"
    const items: ddlItem[] =
      data?.map((producto) => ({
        value: producto.id.toString(),
        text: `${producto.codigo} - ${producto.nombre}`,
      })) || []

    return items
  } catch (error) {
    console.error("Error en app/actions/productos en listaDesplegableProductos:", error)
    return []
  }
}

// Función: listaDesplegableProductosXClientes: Lista de productos filtrados por cliente
export async function listaDesplegableProductosXClientes(
  clienteid: number,
): Promise<{ success: boolean; data?: oProducto[]; error?: string }> {
  try {
    // Variable productos de tipo oProducto[]
    let productos: oProducto[] = []

    // Ejecutar la función obtenerProductos con los parámetros por default excepto clienteid
    const resultado = await obtenerProductos(
      -1, // productoid (default)
      "", // productonombre (default)
      clienteid, // clienteid (parámetro recibido)
      -1, // zonaid (default)
      -1, // catalogoid (default)
      "True", // activo (default)
    )

    // Verificar si hubo error
    if (!resultado.success || !resultado.data) {
      return {
        success: false,
        error: resultado.error || "No se encontraron productos para el cliente especificado",
      }
    }

    // Asignar los productos obtenidos
    productos = resultado.data as oProducto[]

    // Retornar success con los productos
    return {
      success: true,
      data: productos,
    }
  } catch (error) {
    console.error("Error en app/actions/productos en listaDesplegableProductosXClientes:", error)
    return {
      success: false,
      error: "Error interno del servidor al ejecutar listaDesplegableProductosXClientes",
    }
  }
}

// Función: operacionMP: Suma de la materia prima utilizada

// Función: operacionME: Suma del material de etiquteado de un producto

// Función: operacionMS: (MP(suma de materia prima) x ME(suma de material etiquetado)) x 0.05

// Función: operacionElaboracion: Suma de MP(suma de materia prima) + ME(suma de material etiquetado) + MS((MP(suma de materia prima) x ME(suma de material etiquetado)) x 0.05)

// Función: operacionMP_Porcentaje: MP/% MP, por lo general es 35%

// Función: operacionME_Porcentaje: ME/% ME, por lo general es 35%

// Función: operacionMS_Porcentaje: MS/% MS, por lo general es 35%

// Función: operacionPrecioHL: Suma de MP_Porcentaje + ME_Porcentaje + MS_Porcentaje

// Función: operacionUtilidadHL:
