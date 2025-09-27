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
  * READS-OBTENER (SELECTS)
    - obtenerProductos / selProductos
    - obtenerProductosPorFiltros / selProductosXFiltros
    - obtenerProductoPorId / selProductoXId
    - obtenerClientes / ddlClientes
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
    - buscarProductosConFiltros
    - getProductoDetailsForModal
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarProducto / updProducto
    - actualizarProductoEtapa1
    - actualizarCostoProducto
  * DELETES-ELIMINAR (DELETES)
    - eliminarProducto / delProducto
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
//Función: crearProducto: función para crear un producto
export async function crearProducto(formData: FormData) {
  try {
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

//Función: obtenerProductos: función para obtener el listado de productos
export async function obtenerProductos(
  productoid = -1,
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  catalogoid = -1,
  activo = "Todos",
) {
  try {
    //Query principal
    let query = supabase
      .from("productos")
      .select(`
        p.id as productoid, 
        p.codigo as productocodigo, 
        p.clienteid as clienteid, 
        c.nombre as clientenombre, 
        p.zonaid as zonaid, 
        z.nombre as zonanombre, 
        p.nombre as productonombre, 
        p.imgurl as productoimgurl, 
        p.unidadmedidaid as productounidadmedidaid, 
        u.descripcion as unidadmedida, 
        p.costo as productocosto, 
        p.activo as productoactivo,
        pc.descripcion as productodescripcion, 
        pc.presentacion as productopresentacion, 
        pc.porcion as productoporcion, 
        pc.modouso as productomodouso, 
        pc.porcionenvase as productoporcionenvase, 
        pc.categoriauso as productocategoriauso, 
        pc.propositoprincipal as productopropositoprincipal, 
        pc.propuestavalor as productopropuestavalor, 
        pc.instruccionesingesta as productoinstruccionesingesta, 
        pc.edadminima as productoedadminima, 
        pc.advertencia as productoadvertencia, 
        pc.condicionesalmacenamiento as productocondicionesalmacenamiento
        cat.id as catalogoid,
        cat.nombre as catalogonombre,
        cat.descripcion as catalogodescripcion,
        pxc.precioventa as productocatalogoprecioventa,
        pxc.margenutilidad as productocatalogomargenutilidad
      `)
      .from("productos", "p")
      .leftJoin("productoscaracteristicas", "pc.productoid", "p.id")
      .leftJoin("clientes", "c.id", "p.clienteid")
      .leftJoin("zonas", "z.id", "p.zonaid")
      .leftJoin("unidadesmedida", "u.id", "p.unidadmedidaid")
      .leftJoin("productosxcatalogo", "pxc.productoid", "p.id")
      .leftJoin("catalogos", "cat.id", "pxc.catalogoid")

    //Filtros al query dependiendo parametros
    if (productoid !== -1) {
      query = query.eq("p.id", productoid)
    }

    if (clienteid !== -1) {
      query = query.eq("p.clienteid", clienteid)
    }
    if (zonaid !== -1) {
      query = query.eq("p.zonaid", zonaid)
    }
    if (catalogoid !== -1) {
      query = query.eq("cat.id", zonaid)
    }
    if (productonombre !== "") {
      query = query.ilike("p.nombre", `%${productonombre}%`)
    }
    if (activo !== "Todos") {
      if (activo === "True") {
        query = query.eq("p.activo", true)
      }
      if (activo === "False") {
        query = query.eq("p.activo", false)
      }
    }

    //Ejecutar query
    query = query.order("productonombre", { ascending: true })

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

//Función: obtenerProductoPorId: función para obtener un producto especifico por id
export async function obtenerProductoPorId(id: number) {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select(`
        *,
        productos_ingredientes (
          id,
          cantidad,
          ingredientes (
            id,
            nombre,
            costo,
            tipounidadmedida (
              descripcion
            )
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error obteniendo producto:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerProductoPorId:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerClientes: función para obtener el listado de clientes para dropdown
export async function obtenerClientes() {
  try {
    const { data, error } = await supabaseAdmin
      .from("clientes")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo clientes:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerClientes:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerFormulas: función para obtener el listado de formulas para dropdown
export async function obtenerFormulas() {
  try {
    const { data, error } = await supabaseAdmin
      .from("formulas")
      .select("id, nombre, costo, cantidad")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo formulas:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerFormulas:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerZonas: función para obtener el listado de zonas para dropdown
export async function obtenerZonas() {
  try {
    const { data, error } = await supabaseAdmin.from("zonas").select("id, nombre").order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo zonas:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerZonas:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerCatalogosPorCliente: función para obtener catálogos filtrados por cliente
export async function obtenerCatalogosPorCliente(clienteId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("catalogos")
      .select("id, nombre")
      .eq("clienteid", clienteId)
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo catálogos por cliente:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerCatalogosPorCliente:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerUnidadMedidaFormula: función para obtener la unidad de medida de una fórmula
export async function obtenerUnidadMedidaFormula(formulaId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("formulas")
      .select(`
        id,
        unidadmedidaid,
        tipounidadesmedida!inner(
          id,
          descripcion
        )
      `)
      .eq("id", formulaId)
      .single()

    if (error) {
      console.error("Error obteniendo unidad de medida de fórmula:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data.tipounidadesmedida }
  } catch (error) {
    console.error("Error en obtenerUnidadMedidaFormula:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: agregarFormulaAProducto: función para agregar una fórmula a un producto
export async function agregarFormulaAProducto(
  productoId: number,
  formulaId: number,
  cantidad: number,
  costoParcial: number,
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productosdetalles")
      .insert({
        tiposegmentoid: 1,
        productoid: productoId,
        elementoid: formulaId,
        cantidad: cantidad,
        costoparcial: costoParcial,
        fechacreacion: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error agregando fórmula a producto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos")
    return { success: true, data }
  } catch (error) {
    console.error("Error en agregarFormulaAProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerFormulasAgregadas: función para obtener las fórmulas agregadas a un producto
export async function obtenerFormulasAgregadas(productoId: number) {
  try {
    // First get the productosdetalles records
    const { data: productosDetalles, error: detallesError } = await supabaseAdmin
      .from("productosdetalles")
      .select("id, elementoid, cantidad, costoparcial")
      .eq("productoid", productoId)
      .eq("tiposegmentoid", 1)

    if (detallesError) {
      console.error("Error obteniendo detalles de producto:", detallesError)
      return { success: false, error: detallesError.message }
    }

    if (!productosDetalles || productosDetalles.length === 0) {
      return { success: true, data: [] }
    }

    // Get the formula IDs
    const formulaIds = productosDetalles.map((item) => item.elementoid)

    // Get the formulas data
    const { data: formulas, error: formulasError } = await supabaseAdmin
      .from("formulas")
      .select("id, nombre, costo")
      .in("id", formulaIds)

    if (formulasError) {
      console.error("Error obteniendo fórmulas:", formulasError)
      return { success: false, error: formulasError.message }
    }

    // Combine the data
    const transformedData = productosDetalles.map((item) => {
      const formula = formulas?.find((f) => f.id === item.elementoid)
      return {
        id: item.id,
        formulaId: item.elementoid,
        nombre: formula?.nombre || "",
        cantidad: item.cantidad,
        costo: formula?.costo || 0,
        costoParcial: item.costoparcial,
      }
    })

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error en obtenerFormulasAgregadas:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: eliminarFormulaDeProducto: función para eliminar una fórmula de un producto
export async function eliminarFormulaDeProducto(productoDetalleId: number) {
  try {
    const { error } = await supabaseAdmin.from("productosdetalles").delete().eq("id", productoDetalleId)

    if (error) {
      console.error("Error eliminando fórmula de producto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos")
    return { success: true }
  } catch (error) {
    console.error("Error en eliminarFormulaDeProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerIngredientes: función para obtener el listado de ingredientes
export async function obtenerIngredientes() {
  try {
    const { data, error } = await supabaseAdmin
      .from("ingredientes")
      .select("id, codigo, nombre, costo, unidadmedidaid")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo ingredientes:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerIngredientes:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: getIngredientDetails: función para obtener detalles de un ingrediente específico
export async function getIngredientDetails(ingredienteId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("ingredientes")
      .select(`
        id,
        nombre,
        costo,
        unidadmedidaid,
        tipounidadesmedida!inner(
          id,
          descripcion
        )
      `)
      .eq("id", ingredienteId)
      .single()

    if (error) {
      console.error("Error obteniendo detalles del ingrediente:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        costo: data.costo,
        unidadMedida: data.tipounidadesmedida?.descripcion,
      },
      unidadMedidaId: data.unidadmedidaid,
    }
  } catch (error) {
    console.error("Error en getIngredientDetails:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: verificarIngredienteDuplicadoProducto: función para verificar si un ingrediente ya está agregado al producto
export async function verificarIngredienteDuplicadoProducto(productoId: number, ingredienteId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productosdetalles")
      .select("id")
      .eq("productoid", productoId)
      .eq("elementoid", ingredienteId)
      .eq("tiposegmentoid", 2)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error verificando ingrediente duplicado:", error)
      return { success: false, error: error.message }
    }

    return { success: true, exists: !!data }
  } catch (error) {
    console.error("Error en verificarIngredienteDuplicadoProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: agregarIngredienteAProducto: función para agregar un ingrediente a un producto
export async function agregarIngredienteAProducto(
  productoId: number,
  ingredienteId: number,
  cantidad: number,
  costo: number,
) {
  try {
    const costoParcial = costo * cantidad

    const { data, error } = await supabaseAdmin
      .from("productosdetalles")
      .insert({
        tiposegmentoid: 2,
        productoid: productoId,
        elementoid: ingredienteId,
        cantidad: cantidad,
        costoparcial: costoParcial,
        fechacreacion: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error agregando ingrediente a producto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos")
    return { success: true, data }
  } catch (error) {
    console.error("Error en agregarIngredienteAProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerIngredientesAgregados: función para obtener los ingredientes agregados a un producto
export async function obtenerIngredientesAgregados(productoId: number) {
  try {
    // First get the productosdetalles records for ingredients (tiposegmentoid = 2)
    const { data: productosDetalles, error: detallesError } = await supabaseAdmin
      .from("productosdetalles")
      .select("id, elementoid, cantidad, costoparcial")
      .eq("productoid", productoId)
      .eq("tiposegmentoid", 2)

    if (detallesError) {
      console.error("Error obteniendo detalles de ingredientes:", detallesError)
      return { success: false, error: detallesError.message }
    }

    if (!productosDetalles || productosDetalles.length === 0) {
      return { success: true, data: [] }
    }

    // Get the ingredient IDs
    const ingredienteIds = productosDetalles.map((item) => item.elementoid)

    // Get the ingredients data with unit information
    const { data: ingredientes, error: ingredientesError } = await supabaseAdmin
      .from("ingredientes")
      .select(`
        id,
        nombre,
        costo,
        tipounidadesmedida!inner(
          descripcion
        )
      `)
      .in("id", ingredienteIds)

    if (ingredientesError) {
      console.error("Error obteniendo ingredientes:", ingredientesError)
      return { success: false, error: ingredientesError.message }
    }

    // Combine the data
    const transformedData = productosDetalles.map((item) => {
      const ingrediente = ingredientes?.find((i) => i.id === item.elementoid)
      return {
        id: item.id,
        ingredienteId: item.elementoid,
        nombre: ingrediente?.nombre || "",
        cantidad: item.cantidad,
        unidad: ingrediente?.tipounidadesmedida?.descripcion || "",
        ingredientecostoparcial: item.costoparcial,
      }
    })

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error en obtenerIngredientesAgregados:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: eliminarIngredienteDeProducto: función para eliminar un ingrediente de un producto
export async function eliminarIngredienteDeProducto(productoDetalleId: number) {
  try {
    const { error } = await supabaseAdmin.from("productosdetalles").delete().eq("id", productoDetalleId)

    if (error) {
      console.error("Error eliminando ingrediente de producto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos")
    return { success: true }
  } catch (error) {
    console.error("Error en eliminarIngredienteDeProducto:", error)
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

// Función: obtenerProductoCompleto: función para obtener todos los datos de un producto para edición
export async function obtenerProductoCompleto(productoId: number) {
  try {
    const { data, error } = await supabaseAdmin.from("productos").select("*").eq("id", productoId).single()

    if (error) {
      console.error("Error obteniendo producto completo:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerProductoCompleto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: actualizarProductoEtapa1: función para actualizar información básica del producto
export async function actualizarProductoEtapa1(productoId: number, formData: FormData) {
  try {
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
    const updateData: any = {
      nombre: formData.get("nombre") as string,
      descripcion: formData.get("descripcion") as string,
      clienteid: Number.parseInt(formData.get("clienteid") as string),
      //catalogoid: Number.parseInt(formData.get("catalogoid") as string) || null,
      presentacion: formData.get("presentacion") as string,
      porcion: formData.get("porcion") as string,
      modouso: formData.get("modouso") as string,
      porcionenvase: formData.get("porcionenvase") as string,
      formaid: Number.parseInt(formData.get("formaid") as string) || null,
      categoriauso: formData.get("categoriauso") as string,
      propositoprincipal: formData.get("propositoprincipal") as string,
      propuestavalor: formData.get("propuestavalor") as string,
      instruccionesingesta: formData.get("instruccionesingesta") as string,
      edadminima: Number.parseInt(formData.get("edadminima") as string),
      advertencia: formData.get("advertencia") as string,
      condicionesalmacenamiento: formData.get("condicionesalmacenamiento") as string,
      vidaanaquelmeses: Number.parseInt(formData.get("vidaanaquelmeses") as string),
      activo: formData.get("activo") === "true",
      zonaid: Number.parseInt(formData.get("zonaid") as string) || null,
      //fechaactualizacion: new Date().toISOString(),
    }

    // Only update image URL if a new image was uploaded
    if (imgUrl) {
      updateData.imgurl = imgUrl
    }

    const { data, error } = await supabaseAdmin
      .from("productos")
      .update(updateData)
      .eq("id", productoId)
      .select()
      .single()

    if (error) {
      console.error("Error updating producto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos")
    return { success: true, data }
  } catch (error) {
    console.error("Error en actualizarProductoEtapa1:", error)
    return { success: false, error: "Error interno del servidor" }
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

// Función: verificarFormulaEnProducto: función para verificar si un producto tiene al menos una fórmula
export async function verificarFormulaEnProducto(productoId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productosdetalles")
      .select("id")
      .eq("productoid", productoId)
      .eq("tiposegmentoid", 1)
      .limit(1)

    if (error) {
      console.error("Error verificando fórmula en producto:", error)
      return { success: false, error: error.message }
    }

    return { success: true, hasFormula: data && data.length > 0 }
  } catch (error) {
    console.error("Error en verificarFormulaEnProducto:", error)
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

// Función: obtenerProductoDetalladoCompleto: función para obtener toda la información de un producto
export async function obtenerProductoDetalladoCompleto(productoId: number) {
  try {
    const { data, error } = await supabaseAdmin.from("productos").select("*").eq("id", productoId).single()

    if (error) {
      console.error("Error obteniendo producto detallado:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerProductoDetalladoCompleto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerFormulasAsociadasProducto: función para obtener fórmulas asociadas a un producto
export async function obtenerFormulasAsociadasProducto(productoId: number) {
  try {
    // First get productosdetalles records for formulas (tiposegmentoid = 1)
    const { data: detallesData, error: detallesError } = await supabaseAdmin
      .from("productosdetalles")
      .select("elementoid, cantidad, costoparcial")
      .eq("productoid", productoId)
      .eq("tiposegmentoid", 1)

    if (detallesError) {
      console.error("Error obteniendo detalles de fórmulas:", detallesError)
      return { success: false, error: detallesError.message }
    }

    if (!detallesData || detallesData.length === 0) {
      return { success: true, data: [] }
    }

    // Get formula names using elementoid
    const formulaIds = detallesData.map((item) => item.elementoid)
    const { data: formulasData, error: formulasError } = await supabaseAdmin
      .from("formulas")
      .select("id, nombre")
      .in("id", formulaIds)

    if (formulasError) {
      console.error("Error obteniendo nombres de fórmulas:", formulasError)
      return { success: false, error: formulasError.message }
    }

    // Combine data
    const transformedData = detallesData.map((detalle) => {
      const formula = formulasData?.find((f) => f.id === detalle.elementoid)
      return {
        formula: formula?.nombre || "Fórmula no encontrada",
        cantidad: detalle.cantidad,
        costoparcial: detalle.costoparcial,
      }
    })

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error en obtenerFormulasAsociadasProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerIngredientesAsociadosProducto: función para obtener ingredientes asociados a un producto
export async function obtenerIngredientesAsociadosProducto(productoId: number) {
  try {
    // First get productosdetalles records for ingredients (tiposegmentoid = 2)
    const { data: detallesData, error: detallesError } = await supabaseAdmin
      .from("productosdetalles")
      .select("elementoid, cantidad, costoparcial")
      .eq("productoid", productoId)
      .eq("tiposegmentoid", 2)

    if (detallesError) {
      console.error("Error obteniendo detalles de ingredientes:", detallesError)
      return { success: false, error: detallesError.message }
    }

    if (!detallesData || detallesData.length === 0) {
      return { success: true, data: [] }
    }

    // Get ingredient names using elementoid
    const ingredientIds = detallesData.map((item) => item.elementoid)
    const { data: ingredientesData, error: ingredientesError } = await supabaseAdmin
      .from("ingredientes")
      .select("id, nombre")
      .in("id", ingredientIds)

    if (ingredientesError) {
      console.error("Error obteniendo nombres de ingredientes:", ingredientesError)
      return { success: false, error: ingredientesError.message }
    }

    // Combine data
    const transformedData = detallesData.map((detalle) => {
      const ingrediente = ingredientesData?.find((i) => i.id === detalle.elementoid)
      return {
        ingrediente: ingrediente?.nombre || "Ingrediente no encontrado",
        cantidad: detalle.cantidad,
        costoparcial: detalle.costoparcial,
      }
    })

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error en obtenerIngredientesAsociadosProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerProductosXFiltros: función para obtener productos con filtros específicos
export async function obtenerProductosXFiltros(nombre = "", clienteId = -1, catalogoId = -1, estatus = "true") {
  try {
    let query = supabaseAdmin.from("productos").select(`
      id, nombre, descripcion, propositoprincipal, costo, activo, imgurl,
      productosxcatalogo!left(
        catalogos!left(
          id, nombre,
          clientes!left(id, nombre)
        )
      )
    `)

    if (nombre !== "" && nombre !== null) {
      query = query.ilike("nombre", `%${nombre}%`) // Búsqueda insensible a mayúsculas/minúsculas
    }

    if (clienteId > 0) {
      query = query.eq("productosxcatalogo.catalogos.clientes.id", clienteId)
    }

    if (catalogoId > 0) {
      query = query.eq("productosxcatalogo.catalogos.id", catalogoId)
    }

    if (estatus === "false") {
      query = query.eq("activo", false)
    } else if (estatus === "true") {
      query = query.eq("activo", true)
    }

    query = query.order("fechacreacion", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo productos con filtros:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerProductosXFiltros:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getProductoDetailsForModal(productoId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productosxcatalogo")
      .select(
        `
        productos (
          id,
          nombre,
          descripcion,
          presentacion,
          porcion,
          modouso,
          categoriauso,
          propuestavalor,
          instruccionesingesta,
          propositoprincipal,
          imgurl,
          costo
        ),
        catalogos (
          id,
          nombre,
          clientes (
            id,
            nombre
          )
        ),
        precioventa,
        margenutilidad
      `,
      )
      .eq("productoid", productoId)

    if (error) {
      console.error("Error fetching producto details for modal:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const formattedData = data.map((item: any) => ({
      id: item.productos.id,
      Cliente: item.catalogos.clientes.nombre,
      Catalogo: item.catalogos.nombre,
      Producto: item.productos.nombre,
      descripcion: item.productos.descripcion,
      presentacion: item.productos.presentacion,
      porcion: item.productos.porcion,
      modouso: item.productos.modouso,
      categoriauso: item.productos.categoriauso,
      propuestavalor: item.productos.propuestavalor,
      propositoprincipal: item.productos.propositoprincipal,
      imgurl: item.productos.imgurl,
      CostoElaboracion: item.productos.costo, // Asumiendo que 'costo' es el costo de elaboración
      precioventa: item.precioventa,
      margenutilidad: item.margenutilidad,
      Costo: item.productos.costo, // Mantener 'Costo' para compatibilidad si es necesario
      PrecioSugerido: item.productos.costo * 1.2, // Ejemplo de precio sugerido
    }))

    return { success: true, data: formattedData }
  } catch (error) {
    console.error("Unexpected error in getProductoDetailsForModal:", error)
    return { success: false, error: "Internal server error" }
  }
}

export const getUnidadMedidaFormula = obtenerUnidadMedidaFormula

export async function obtenerProductosIniciales(rolId: number, clienteId: number) {
  try {
    // Determine client filter based on RolId
    const clienteIdFiltro = [1, 2, 3].includes(rolId) ? -1 : clienteId

    let query = supabaseAdmin.from("productos").select(`
        id, nombre, descripcion, costo, activo, imgurl,
        productosxcatalogo!inner(
          catalogoid,
          catalogos!inner(
            id, nombre,
            clientes!inner(id, nombre)
          )
        )
      `)

    // Apply client filter based on RolId
    if (clienteIdFiltro !== -1) {
      query = query.eq("productosxcatalogo.catalogos.clientes.id", clienteIdFiltro)
    }

    query = query.eq("activo", true).order("nombre", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo productos iniciales:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerProductosIniciales:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: buscarProductosConFiltros: función para buscar productos con filtros usando valores de inputs directamente
export async function buscarProductosConFiltros(
  nombre = "",
  clienteId = -1,
  catalogoId = -1,
  estatus = "true",
  rolId: number,
  userClienteId: number,
) {
  try {
    let query = supabaseAdmin.from("productos").select(`
      id, nombre, descripcion, propositoprincipal, costo, activo, imgurl,
      productosxcatalogo!inner(
        catalogos!inner(
          id, nombre,
          clientes!inner(id, nombre)
        )
      )
    `)

    // Apply name filter
    if (nombre !== "" && nombre !== null) {
      query = query.ilike("nombre", `%${nombre}%`)
    }

    if (clienteId > 0) {
      query = query.eq("productosxcatalogo.catalogos.clientes.id", clienteId)
    }

    // Apply catalog filter
    if (catalogoId > 0) {
      query = query.eq("productosxcatalogo.catalogos.id", catalogoId)
    }

    // Apply status filter
    if (estatus === "false") {
      query = query.eq("activo", false)
    } else if (estatus === "true") {
      query = query.eq("activo", true)
    }

    query = query.order("nombre", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error buscando productos con filtros:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en buscarProductosConFiltros:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
