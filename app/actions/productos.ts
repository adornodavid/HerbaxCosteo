"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabaseAdmin variable
const supabase = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

/* ==================================================
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
    
    - obtenerProductosPorFiltros / selProductosXFiltros
    - obtenerProductoPorId / selProductoXId
    
    - obtenerFormulas / ddlFormulas
    - obtenerZonas / ddlZonas

    - obtenerCatalogosPorCliente / selCatalogosXCliente
    - obtenerFormulasAgregadas / selFormulasAgregadas
    - obtenerIngredientes / selIngredientes
    - getIngredientDetails / selIngredienteDetalles
    - obtenerIngredientesAgregados / selIngredientesAgregados
    - obtenerCostoTotalProducto / selCostoTotalProducto
    - obtenerProductoCompleto
    - finalizarProducto
    - obtenerProductoDetalladoCompleto
    - obtenerFormulasAsociadasProducto
    - obtenerIngredientesAsociadosProducto
    - obtenerProductosIniciales
    - getProductoDetailsForModal
    
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


    - eliminarFormulaDeProducto / delFormulaDeProducto
    - eliminarIngredienteDeProducto / delIngredienteDeProducto
    - eliminarProductoIncompleto

  * SPECIALS-ESPECIALES ()
    - estatusActivoProducto / actProducto
    - listaDesplegableProductos / ddlProductos

    
    - obtenerUnidadMedidaFormula / selUnidadMedidaFormula
    - listaDesplegableClientesProductos
    - verificarFormulaEnProducto
================================================== */

/*==================================================
    CREATES-CREAR (INSERTS)
================================================== */
//Función: crearProducto: función para crear un producto
export async function crearProducto(formData: FormData) {
  try {
    //Primero validar con la funcion obtenerProducto, parametros: nombre, clienteid, zonaid

    //Variables auxiliares
    let imgUrl = ""

    // Handle image upload if present
    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const fileName = `${Date.now()}-${imagen.name}`

      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("herbax")
        .upload(`productos/${fileName}`, imagen)

      if (uploadError) {
        console.error("Error uploading image:", uploadError)
        return { success: false, error: "Error al subir la imagen" }
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage.from("herbax").getPublicUrl(`productos/${fileName}`)

      imgUrl = urlData.publicUrl
    }

    // Extract form data
    const nombre = formData.get("nombre") as string
    const descripcion = formData.get("descripcion") as string
    const clienteid = Number.parseInt(formData.get("clienteid") as string)
    const presentacion = formData.get("presentacion") as string
    const porcion = formData.get("porcion") as string
    const modouso = formData.get("modouso") as string
    const porcionenvase = formData.get("porcionenvase") as string
    const formaid = Number.parseInt(formData.get("formaid") as string) || null
    const categoriauso = formData.get("categoriauso") as string
    const propositoprincipal = formData.get("propositoprincipal") as string
    const propuestavalor = formData.get("propuestavalor") as string
    const instruccionesingesta = formData.get("instruccionesingesta") as string
    const edadminima = Number.parseInt(formData.get("edadminima") as string)
    const advertencia = formData.get("advertencia") as string
    const condicionesalmacenamiento = formData.get("condicionesalmacenamiento") as string
    const vidaanaquelmeses = Number.parseInt(formData.get("vidaanaquelmeses") as string)
    const activo = formData.get("activo") === "true"
    const zonaid = Number.parseInt(formData.get("zonaid") as string) || null

    // Insert into productos table
    const { data, error } = await supabaseAdmin
      .from("productos")
      .insert({
        nombre,
        descripcion,
        clienteid,
        presentacion,
        porcion,
        modouso,
        porcionenvase,
        formaid,
        categoriauso,
        propositoprincipal,
        propuestavalor,
        instruccionesingesta,
        edadminima,
        advertencia,
        condicionesalmacenamiento,
        vidaanaquelmeses,
        imgurl: imgUrl,
        fechacreacion: new Date().toISOString(),
        activo,
        zonaid,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating producto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos")
    return { success: true, data }
  } catch (error) {
    console.error("Error en crearProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

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
    // Primero obtener ids de filtro por caso especial de relacion de tablas
    let Ids = [];
    if (catalogoid > 0) {
      const { data, error } = await supabase
        .from("productosxcatalogo")
        .select("productoid")
        .eq("catalogoid", catalogoid);

      if (!error && data) {
        Ids = data.map(item => item.productoid);
      }
    }
    
    // Query principal
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

/*==================================================
  UPDATES-ACTUALIZAR (UPDATES)
================================================== */
//Funcion: actualizarProducto / updProducto: Actualizar información del producto, basica?

//Función: actualizarProducto: función para actualizar un producto
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

// Función: listaDesplegableClientesProductos: función similar a listaDesplegableClientes para productos
export async function listaDesplegableClientesProductos(id: string, nombre: string) {
  try {
    let query = supabaseAdmin.from("clientes").select("id, nombre").eq("activo", true)

    // Apply filters conditionally
    if (nombre && nombre.trim() !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }

    if (id && id !== "-1") {
      query = query.eq("id", Number.parseInt(id))
    }

    query = query.order("nombre", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo clientes para dropdown:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableClientesProductos:", error)
    return { success: false, error: "Error interno del servidor" }
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
