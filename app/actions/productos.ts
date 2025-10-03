"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Producto } from "@/types/productos.types"
import { imagenSubir } from "@/app/actions/utilerias"
/*
import { crearFormulaXProducto, obtenerFormulasXProducto, actualizarFormulaXProducto, eliminarFormulaXProducto } from "@/app/actions/formulas"
import { crearMateriaPrimaXProducto, obtenerMatriasPrimasXProducto, actualizarMateriaPrimaXProducto, eliminarMateriaPrimaXProductoubir } from "@/app/actions/materiasprimas"
import { crearMaterialEtiquetadoXProducto, obtenerMaterialesEtiquetadoXProducto, actualizarMaterialEtiquetadoXProducto, eliminarMaterialEtiquetadoXProducto } from "@/app/actions/materialesetiquetado"
*/

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
  
  --------------------
  Funciones
  --------------------
	* CREATES-CREAR (INSERTS)
    - crearProducto / insProducto
    - crearProductoCaracteristicas / insProductoCaracteristicas
    - crearProductoXCatalogo / insProductoXCatelogo

  * READS-OBTENER (SELECTS)
    - obtenerProductos / selProductos
    - obtenerProductosCaracteristicas / selProductosCaracteristicas
    - obtenerProductosXCatalogos / selProductosXCatalogos
    
    - finalizarProducto
    
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarProducto / updProducto
    - actualizarProductoCaracteristicas / updProductoCaracteristicas
    - actualizarProductoXCatalogo / updProductoXCatalogo

    - actualizarProductoEtapa1
    - actualizarCostoProducto

  * DELETES-ELIMINAR (DELETES)
    - eliminarProducto / delProducto
    - eliminarProductoCaracteristicas / delProductoCaracteristicas
    - eliminarProductoXCatalogo / delProductoXCatalogo

    - eliminarProductoIncompleto

  * SPECIALS-ESPECIALES ()
    - estatusActivoProducto / actProducto
    - listaDesplegableProductos / ddlProductos
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
//Función: objetoProducto / oProducto (Individual): Esta funcion crea un objeto/clase de un producto de manera individual
export async function objetoProducto(
  productoid = -1,
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  catalogoid = -1,
  activo = "Todos",
): Promise<{ success: boolean; data?: Producto; error?: string }> {
  try {
    const resultado = await obtenerProductos(productoid, productonombre, clienteid, zonaid, catalogoid, activo)

    if (!resultado.success || !resultado.data) {
      return { success: false, error: resultado.error || "No se encontraron datos" }
    }

    if (resultado.data.length === 0) {
      return { success: false, error: "Producto no encontrado" }
    }

    const producto: Producto = resultado.data[0] as Producto

    return { success: true, data: producto }
  } catch (error) {
    console.error("Error en app/actions/productos en objetoProducto (Individual):", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

//Función: objetoProductos / oProductos (Listado): Esta funcion crea un objeto/clase de un listado de productos, es un array
export async function objetoProductos(
  productoid = -1,
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  catalogoid = -1,
  activo = "Todos",
): Promise<{ success: boolean; data?: Producto[]; error?: string }> {
  try {
    const resultado = await obtenerProductos(productoid, productonombre, clienteid, zonaid, catalogoid, activo)

    if (!resultado.success || !resultado.data) {
      return { success: false, error: resultado.error || "No se encontraron datos" }
    }

    const productos: Producto[] = resultado.data as Producto[]

    return { success: true, data: productos }
  } catch (error) {
    console.error("Error en app/actions/productos en objetoProductos (Listado/Array):", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

/*==================================================
    CREATES-CREAR (INSERTS)
================================================== */
//Función: crearProducto: función para crear un producto, información basica
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

//Función: crearProductoCaracteristicas: función para crear las caracteristicas de un producto, información secundaria

//Función: crearProductoXCatalogo: función para crear la relaacion de un producto con un catalogo

/*==================================================
  READS-OBTENER (SELECTS)
================================================== */
//Funcion: obtenerProductos / selProductos: Funcion para obtener el o los productos, puede ser individual o listado
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
        costo,
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
        productosxcatalogo!productoid(
          catalogoid,
          precioventa,
          margenutilidad,
          catalogos!catalogoid(
            nombre,
            descripcion
          )
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

//Funcion: obtenerProductosCaracteristicas / selProductosCaracteristicas: Funcion para obtener las características de un producto
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
      console.error("Error obteniendo características de productos en app/actions/productos en obtenerProductosCaracteristicas:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en app/actions/productos en obtenerProductosCaracteristicas:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

//Función: obtenerProductosXCatalogos / selProductosXCatalogos, funcion para obtener en un array el listado de los ids de productos
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

    const productosIds: number[] = data.map((item) => item.productoid)

    return { success: true, data: productosIds }
  } catch (error) {
    console.error("Error en obtenerProductosXCatalogos:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

/*==================================================
  UPDATES-ACTUALIZAR (UPDATES)
================================================== */
//Funcion: actualizarProducto / updProducto: Actualizar información del producto, basica?
export async function actualizarProducto(
  id: number,
  productoData: {
    nombre?: string
    descripcion?: string | null
    instruccionespreparacion?: string | null
    tiempopreparacion?: string | null
    costototal?: number | null
    imgurl?: string | null
    activo?: boolean
  },
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos")
      .update({
        ...productoData,
        fechaactualizacion: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error actualizando producto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos")
    revalidatePath(`/productos/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error en actualizarProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

/*==================================================
  * DELETES-ELIMINAR (DELETES)
================================================== */
// Función: eliminarProductoIncompleto: función para eliminar un producto incompleto y sus detalles
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

/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */
// Función: listaDesplegableProductos:

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
