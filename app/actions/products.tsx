"use server"

/* ==================================================
  Imports
================================================== */
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type { ddlItem } from "@/types/common.types"
import type { oProducto } from "@/types/productos.types"
import type { oProductoAvanzado } from "@/types/objetoproducto.types"
import { imagenSubir } from "@/app/actions/utilerias"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey) // Declare the supabaseAdmin variable
const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

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
    - obtenerProductosIdsXFormulas / selProductosIdsXFormulas
    - obtenerProductosIdsXMateriales / selProductosIdsXMateriales // Added

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarProducto / updProducto
    - actualizarProductoCaracteristicas / updProductoCaracteristicas
    - actualizarProductoXCatalogo / updProductoXCatalogo
    - actualizarCosteoProducto
    - recalcularProducto

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
// Función: objetoProductoAvanzado / oProductoAvanzado (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoProductoAvanzado(
  productoid = -1,
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  estatus = "Todos",
): Promise<{ success: boolean; data?: oProductoAvanzado; error?: string }> {
  try {
    // Primero ejecutar funcion de obtener
    const resultado = await obtenerProductosAvanzado(
      productoid,
      productonombre,
      clienteid,
      zonaid,
      estatus,
    )

    // Validar resultado de ejecucion
    if (!resultado.success || !resultado.data) {
      return { success: false, error: resultado.error || "No se encontraron datos" }
    }

    // Si hubo un error en la ejecucion retornar
    if (resultado.data.length === 0) {
      return { success: false, error: "Producto no encontrado" }
    }

    // Creacion de data en fases
    // FASE 1: Agrupar resultados por productoid y llenar datos principales
    const datosAgrupados = resultado.data.reduce((acc: any, row: any) => {
      if (!acc[row.productoid]) {
        acc[row.productoid] = {
          clienteid: row.clienteid,
          cliente: row.cliente,
          zonaid: row.zonaid,
          zona: row.zona,
          codigomaestro: row.codigomaestro,
          codigo: row.codigo,
          codigointerno: row.codigointerno,
          id: row.productoid,
          productoprincipal: row.productoprincipal,
          envase: row.envase,
          cantidadpresentacion: row.cantidadpresentacion?.toString() || null,
          unidadpresentacion: row.unidadpresentacion,
          presentacion: row.presentacion,
          estatus: row.estatus?.toString() || null,
          nombre: row.nombreproducto,
          sistemaid: row.sistemaid,
          objetivo: row.objetivo,
          subforma: row.subforma,
          dosis: row.dosis,
          porcion: row.porcion,
          frecuencia: row.frecuencia,
          envaseml: row.envaseml?.toString() || null,
          imgurl: row.imgurl,
          costo: row.costo?.toString() || null,
          mp: row.mp?.toString() || null,
          mem: row.mem?.toString() || null,
          me: row.me?.toString() || null,
          ms: row.ms?.toString() || null,
          mp_porcentaje: row.mp_porcentaje?.toString() || null,
          mem_porcentaje: row.mem_porcentaje?.toString() || null,
          me_porcentaje: row.me_porcentaje?.toString() || null,
          ms_porcentaje: row.ms_porcentaje?.toString() || null,
          mp_costeado: row.mp_costeado?.toString() || null,
          mem_costeado: row.mem_costeado?.toString() || null,
          me_costeado: row.me_costeado?.toString() || null,
          ms_costeado: row.ms_costeado?.toString() || null,
          costototal: row.costototal?.toString() || null,
          preciohl: row.preciohl?.toString() || null,
          utilidadhl: row.utilidadhl?.toString() || null,
          forecasthl: row.forecasthl?.toString() || null,
          preciosinivaaa: row.preciosinivaaa?.toString() || null,
          precioconivaaa: row.precioconivaaa?.toString() || null,
          tipocomisión: row.tipocomision,
          formulas: [],
          empaque: [],
          envase: [],
          registros: [] // Almacenar todos los registros para procesamiento posterior
        }
      }
      // Guardar todos los registros para la fase 2
      acc[row.productoid].registros.push(row)
      return acc
    }, {})

    // Obtener el primer producto agrupado
    const primerProductoId = Object.keys(datosAgrupados)[0]
    const productoBase = datosAgrupados[primerProductoId]

    // FASE 2: Llenar información de fórmulas
    const formulasMap = new Map()
    
    productoBase.registros.forEach((row: any) => {
      if (row.tipomaterial === "formula" && !formulasMap.has(row.id)) {
        formulasMap.set(row.id, {
          id: row.id,
          codigo: row.codigomaterial,
          nombre: null,
          titulo: null,
          detalle: null,
          especificaciones: null,
          medida: row.medida ?? null,
          tipomedida: row.tipomedida ?? null,
          unidadmediaid: row.unidadmedidaid ?? null,
          unidadmedida: row.unidadmedidamaterial ?? null,
          costo: row.costomaterial?.toString() ?? null,
          fxpcantidad: row.cantidad?.toString() ?? null,
          fxpcostoparcial: row.costoparcial?.toString() ?? null,
          materias: null
        })
      }
    })

    productoBase.formulas = Array.from(formulasMap.values())
    
    // Eliminar el array temporal de registros
    delete productoBase.registros

    const producto: oProductoAvanzado = productoBase

    return { success: true, data: producto }
  } catch (error) {
    console.error("Error en app/actions/productos en objetoProducto Avanzado(Individual):", error)
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
        "", // Added new parameters with default values
        "",
        -1,
        -1,
        "",
        "",
        "",
        -1,
        -1,
        -1,
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

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Funcion: obtenerProductos / selProductos: Funcion para obtener
export async function obtenerProductos(
  productoid = -1,
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  activo = "Todos",
  codigomaestro = "",
  codigo = "",
  codigointerno = "",
  presentacion = "",
  sistemaid = -1,
  categoria = "",
  envase = "",
  formulaid = -1,
  materiaprimaid = -1,
  materialid = -1,
) {
  try {
    // Consultar directamente la vista vw_oproductos
    let query = supabase.from("vw_oproductos").select("*")

    // Filtros en query, dependiendo de los parámetros recibidos
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
      query = query.ilike("producto", `%${productonombre}%`)
    }

    if (codigomaestro !== "") {
      query = query.ilike("codigomaestro", `%${codigomaestro}%`)
    }

    if (codigo !== "") {
      query = query.ilike("codigo", `%${codigo}%`)
    }

    if (codigointerno !== "") {
      query = query.ilike("codigointerno", `%${codigointerno}%`)
    }

    if (presentacion !== "") {
      query = query.ilike("presentacion", `%${presentacion}%`)
    }

    if (sistemaid !== -1) {
      query = query.eq("sistemaid", sistemaid)
    }

    if (categoria !== "") {
      query = query.ilike("nombre", `%${categoria}%`)
    }

    if (envase !== "") {
      query = query.ilike("envase", `%${envase}%`)
    }

    if (formulaid !== -1) {
      query = query.eq("formulaid", formulaid)
    }

    if (materiaprimaid !== -1) {
      query = query.eq("materiaprimaid", materiaprimaid)
    }

    if (materialid !== -1) {
      query = query.eq("materialid", materialid)
    }

    if (activo !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activo)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activo)

      if (isActive) {
        query = query.eq("estatus", true)
      } else if (isInactive) {
        query = query.eq("estatus", false)
      }
    }

    // Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Variables y resultados del query
    const { data, error } = await query

    // Error en query
    if (error) {
      return { success: false, error: error.message }
    }

    // Retorno de data
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Funcion: obtenerProductosAvanzado / selProductosAvanzado: Funcion para obtener productos con estructura avanzada
export async function obtenerProductosAvanzado(
  productonombre = "",
  clienteid = -1,
  zonaid = -1,
  estatus = "Todos",
  codigomaestro = "",
  codigo = "",
  codigointerno = "",
  presentacion = "",
  sistemaid = -1,
  categoria = "",
  envase = "",
  nombreformula = "",
  codigoformula = "",
  especificacionesformula = "",
  formula = "",
  medidasformulas = "",
  nombrematerialempaque = "",
  codigoempaque = "",
  familiaempaque = "",
  detalleempaque = "",
  especificacionesempaque = "",
  pais = "",
  medidaempaque = "",
  color = "",
  nombremateriaprima = "",
  codigomateriaprima = "",
  familiamateriaprima = "",
  especificacionesmateriaprima = "",
  presentacionmateriaprima = "",
) {
  try {
    console.log("[v0] Backend - obtenerProductosAvanzado iniciando con clienteid:", clienteid)
    
    // Obtener todos los registros usando paginación
    const pageSize = 1000
    let allData: any[] = []
    let hasMore = true
    let currentPage = 0

    while (hasMore) {
      const from = currentPage * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from("vw_oreportelistadoavanzado")
        .select("*")
        .order("productoid", { ascending: true })
        .range(from, to)

      // Filtro por clienteid
      if (clienteid !== -1) {
        query = query.eq("clienteid", clienteid)
      }
      

      if (zonaid !== -1) {
      query = query.eq("zonaid", zonaid)
      }

      if (productonombre !== "") {
      query = query.ilike("nombreproducto", `%${productonombre}%`)
      }

       if (codigomaestro !== "") {
      query = query.ilike("codigomaestro", `%${codigomaestro}%`)
      }

      if (codigo !== "") {
      query = query.ilike("codigo", `%${codigo}%`)
      }

      if (codigointerno !== "") {
      query = query.ilike("codigointerno", `%${codigointerno}%`)
      }

      if (presentacion !== "") {
        query = query.ilike("presentacion", `%${presentacion}%`)
      }

      if (sistemaid !== -1) {
        query = query.eq("sistemaid", sistemaid)
      }

      if (categoria !== "") {
        query = query.ilike("tipocomision", `%${categoria}%`)
      }

      if (envase !== "") {
        query = query.ilike("envase", `%${envase}%`)
      }

      if (nombreformula !== "") {
        query = query.ilike("nombre", `%${nombreformula}%`)
      }
      
      if (codigoformula !== "") {
        query = query.ilike("codigomaterial", `%${codigoformula}%`)
      }

      if (especificacionesformula !== "") {
        query = query.ilike("especificaciones", `%${especificacionesformula}%`)
      }

      if (medidasformulas !== "") {
        query = query.ilike("medida", `%${medidasformulas}%`)
      }
      
      if (formula !== "") {
        query = query.ilike("formula", `%${formula}%`)
      }
            
      if (nombrematerialempaque !== "") {
        query = query.ilike("nombre", `%${nombrematerialempaque}%`)
      }

      if (codigoempaque !== "") {
        query = query.ilike("codigomaterial", `%${codigoempaque}%`)
      }

      if (familiaempaque !== "") {
        query = query.ilike("familia", `%${familiaempaque}%`)
      }

      if (detalleempaque !== "") {
        query = query.ilike("detalle", `%${detalleempaque}%`)
      }

      if (especificacionesempaque !== "") {
        query = query.ilike("especificaciones", `%${especificacionesempaque}%`)
      }

      if (pais !== "") {
        query = query.ilike("pais", `%${pais}%`)
      }

      if (medidaempaque !== "") {
        query = query.ilike("medida", `%${medidaempaque}%`)
      }

      if (color !== "") {
        query = query.ilike("color", `%${color}%`)
      }

      if (nombremateriaprima !== "") {
        query = query.ilike("nombre", `%${nombremateriaprima}%`)
      }
      if (codigomateriaprima !== "") {
        query = query.ilike("codigomaterial", `%${codigomateriaprima}%`)
      }
      if (familiamateriaprima !== "") {
        query = query.ilike("familia", `%${familiamateriaprima}%`)
      }
      if (especificacionesmateriaprima !== "") {
        query = query.ilike("detalle", `%${especificacionesmateriaprima}%`)
      }
      if (presentacionmateriaprima !== "") {
        query = query.ilike("materiapresentacion", `%${presentacionmateriaprima}%`)
      }

      

      if (estatus !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(estatus)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(estatus)

      if (isActive) {
        query = query.eq("estatus", true)
      } else if (isInactive) {
        query = query.eq("estatus", false)
      }
    }

      const { data, error } = await query

      // Error en query
      if (error) {
        console.log("[v0] Backend - Error en query:", error.message)
        return { success: false, error: error.message }
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allData = [...allData, ...data]
        console.log(`[v0] Backend - Página ${currentPage + 1}: obtenidos ${data.length} registros, total acumulado: ${allData.length}`)
        
        // Si obtuvimos menos registros que pageSize, ya no hay más
        if (data.length < pageSize) {
          hasMore = false
        } else {
          currentPage++
        }
      }
    }

    console.log("[v0] Backend - TOTAL REGISTROS RAW obtenidos:", allData.length)
    
    if (allData.length === 0) {
      console.log("[v0] Backend - No se encontraron datos")
      return { success: true, data: [] }
    }

    console.log("[v0] Backend - Primera fila:", allData[0])
    console.log("[v0] Backend - Última fila:", allData[allData.length - 1])
    
    const data = allData

    // Transformar datos al formato oProductoAvanzado
    // Agrupar por productoid
    const productosMap = new Map<number, any>()

    data.forEach((row: any) => {
      const productoid = row.productoid

      // Si el producto no existe en el map, crearlo
      if (!productosMap.has(productoid)) {
        productosMap.set(productoid, {
          clienteid: row.clienteid ?? null,
          cliente: row.cliente ?? null,
          zonaid: row.zonaid ?? null,
          zona: row.zona ?? null,
          codigomaestro: row.codigomaestro ?? null,
          codigo: row.codigo ?? null,
          codigointerno: row.codigointerno ?? null,
          id: row.productoid ?? null,
          productoprincipal: row.productoprincipal ?? null,
          envase: row.envase ?? null,
          cantidadpresentacion: row.cantidadpresentacion?.toString() ?? null,
          unidadpresentacion: row.unidadpresentacion ?? null,
          presentacion: row.presentacion ?? null,
          estatus: row.estatus?.toString() ?? null,
          nombre: row.nombreproducto ?? null,
          sistemaid: row.sistemaid ?? null,
          objetivo: row.objetivo ?? null,
          subforma: row.subforma ?? null,
          dosis: row.dosis ?? null,
          porcion: row.porcion ?? null,
          frecuencia: row.frecuencia ?? null,
          envaseml: row.envaseml?.toString() ?? null,
          imgurl: row.imgurl ?? null,
          costo: row.costo?.toString() ?? null,
          mp: row.mp?.toString() ?? null,
          mem: row.mem?.toString() ?? null,
          me: row.me?.toString() ?? null,
          ms: row.ms?.toString() ?? null,
          mp_porcentaje: row.mp_porcentaje?.toString() ?? null,
          mem_porcentaje: row.mem_porcentaje?.toString() ?? null,
          me_porcentaje: row.me_porcentaje?.toString() ?? null,
          ms_porcentaje: row.ms_porcentaje?.toString() ?? null,
          mp_costeado: row.mp_costeado?.toString() ?? null,
          mem_costeado: row.mem_costeado?.toString() ?? null,
          me_costeado: row.me_costeado?.toString() ?? null,
          ms_costeado: row.ms_costeado?.toString() ?? null,
          costototal: row.costototal?.toString() ?? null,
          preciohl: row.preciohl?.toString() ?? null,
          utilidadhl: row.utilidadhl?.toString() ?? null,
          forecasthl: row.forecasthl?.toString() ?? null,
          preciosinivaaa: row.preciosinivaaa?.toString() ?? null,
          precioconivaaa: row.precioconivaaa?.toString() ?? null,
          tipocomisión: row.tipocomision ?? null,
          formulas: [],
          empaque: [],
          envases: [],
          _formulasMap: new Map(), // Temporal para evitar duplicados
          _empaqueMap: new Map(), // Temporal para evitar duplicados
          _envaseMap: new Map(), // Temporal para evitar duplicados
          _materiasPrimasMap: new Map(), // Temporal para todas las materias primas del producto
        })
      }

      const producto = productosMap.get(productoid)

      // Agregar fórmulas
      if (row.tipomaterial === "Formula" && row.id) {
        if (!producto._formulasMap.has(row.id)) {
          producto._formulasMap.set(row.id, {
            id: row.id ?? null,
            codigo: row.codigomaterial ?? null,
            nombre: row.nombre ?? null,
            titulo: row.materia ?? null,
            detalle: row.detalle ?? null,
            especificaciones: row.especificaciones ?? null,
            medida: row.medida ?? null,
            tipomedida: row.tipomedida ?? null,
            unidadmediaid: row.unidadmedidaid ?? null,
            unidadmedida: row.unidadmedidamaterial ?? null,
            costo: row.costomaterial?.toString() ?? null,
            fxpcantidad: row.cantidad?.toString() ?? null,
            fxpcostoparcial: row.costoparcial?.toString() ?? null,
            materias: [], // Se llenará después con todas las materias primas del producto
          })
        }
      }

      // Recolectar materias primas del producto (se agregarán a todas las fórmulas después)
      if (row.tipomaterial === "Materia Prima" && row.id) {
        if (!producto._materiasPrimasMap.has(row.id)) {
          producto._materiasPrimasMap.set(row.id, {
            id: row.id ?? null,
            codigo: row.codigomaterial ?? null,
            nombre: row.nombre ?? null,
            titulo: row.materia ?? null,
            detalle: row.detalle ?? null,
            familia: row.familia ?? null,
            presentacion: row.materiapresentacion ?? null,
            factorimportacion: row.factorimportacion?.toString() ?? null,
            costoconfactorimportacion: row.costoconfactorimportacion?.toString() ?? null,
            unidadmediaid: row.unidadmedidaid ?? null,
            unidadmedida: row.unidadmedidamaterial ?? null,
            costo: row.costomaterial?.toString() ?? null,
            mpxfcantidad: row.cantidad?.toString() ?? null,
            mpxfcostoparcial: row.costoparcial?.toString() ?? null,
          })
        }
      }

      // Agregar empaque
      if (row.tipomaterial === "Material de Empaque" && row.id) {
        if (!producto._empaqueMap.has(row.id)) {
          producto._empaqueMap.set(row.id, {
            id: row.id ?? null,
            codigo: row.codigomaterial ?? null,
            nombre: row.nombre ?? null,
            titulo: row.materia ?? null,
            detalle: row.detalle ?? null,
            especificaciones: row.especificaciones ?? null,
            productodestino: row.productodestino ?? null,
            pais: row.pais ?? null,
            medida: row.medida ?? null,
            tipomedida: row.tipomedida ?? null,
            color: row.color ?? null,
            unidadmediaid: row.unidadmedidaid ?? null,
            unidadmedida: row.unidadmedidamaterial ?? null,
            costo: row.costomaterial?.toString() ?? null,
            memxpcantidad: row.cantidad?.toString() ?? null,
            memxpcostoparcial: row.costoparcial?.toString() ?? null,
          })
        }
      }

      // Agregar envase
      if (row.tipomaterial === "Material de Envase" && row.id) {
        if (!producto._envaseMap.has(row.id)) {
          producto._envaseMap.set(row.id, {
            id: row.id ?? null,
            codigo: row.codigomaterial ?? null,
            nombre: row.nombre ?? null,
            titulo: row.materia ?? null,
            detalle: row.detalle ?? null,
            especificaciones: row.especificaciones ?? null,
            productodestino: row.productodestino ?? null,
            pais: row.pais ?? null,
            medida: row.medida ?? null,
            tipomedida: row.tipomedida ?? null,
            color: row.color ?? null,
            unidadmediaid: row.unidadmedidaid ?? null,
            unidadmedida: row.unidadmedidamaterial ?? null,
            costo: row.costomaterial?.toString() ?? null,
            mexpcantidad: row.cantidad?.toString() ?? null,
            mexpcostoparcial: row.costoparcial?.toString() ?? null,
          })
        }
      }
    })

    // Convertir los Maps a Arrays y limpiar propiedades temporales
    const productosArray: any[] = []
    productosMap.forEach((producto) => {
      // Convertir las materias primas a array (estas se agregarán a todas las fórmulas)
      const materiasPrimasArray = Array.from(producto._materiasPrimasMap.values())
      
      // Convertir formulas Map a Array y agregar todas las materias primas a cada fórmula
      producto.formulas = Array.from(producto._formulasMap.values()).map((formula: any) => {
        // Agregar todas las materias primas del producto a esta fórmula
        formula.materias = [...materiasPrimasArray]
        return formula
      })
      
      // Convertir empaque Map a Array
      producto.empaque = Array.from(producto._empaqueMap.values())
      
      // Convertir envase Map a Array
      producto.envases = Array.from(producto._envaseMap.values())

      // Eliminar propiedades temporales
      delete producto._formulasMap
      delete producto._empaqueMap
      delete producto._envaseMap
      delete producto._materiasPrimasMap

      productosArray.push(producto)
    })

    console.log("[v0] Backend - Productos transformados exitosamente, total productos:", productosArray.length)
    console.log("[v0] Backend - Primer producto (muestra):", productosArray[0])

    // Retorno de data transformada
    return { success: true, data: productosArray }
  } catch (error) {
    console.log("[v0] Backend - Error inesperado:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerProductosIdsXMateriales: Agregar función para obtener IDs de productos filtrados por material etiquetado
export async function obtenerProductosIdsXMateriales(
  materialetiquetadoid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (materialetiquetadoid <= 0) {
      return { success: false, error: "ID de material etiquetado inválido" }
    }

    const { data, error } = await supabase
      .from("materialesetiquetadoxproducto")
      .select("productoid")
      .eq("materialetiquetadoid", materialetiquetadoid)

    if (error) {
      console.error("Error en query obtenerProductosIdsXMateriales:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.productoid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerProductosIdsXMateriales de actions/productos:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerProductosIdsXMateriales de actions/productos",
    }
  }
}

// Funcion: obtenerProductos / selProductos: FUNCION para obtener
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

// Use the imported function
export async function obtenerProductosIdsXFormulas(
  formulaid = -1,
  formulasids: number[] = [],
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (formulaid <= 0 && formulasids.length < 1) {
      return { success: false, error: "ID de fórmula inválido" }
    }

    let query = supabase.from("formulasxproducto").select("productoid")

    if (formulaid > 0) {
      query = query.eq("formulaid", formulaid)
    } else if (formulasids.length > 0) {
      query = query.in("formulaid", formulasids)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error en query obtenerProductosIdsXFormulas:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.productoid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerProductosIdsXFormulas:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Dummy function to satisfy the call in obtenerProductos
export async function obtenerFormulasIdsXMateriaprima(
  materiaprimaid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (materiaprimaid <= 0) {
      return { success: false, error: "ID de materia prima inválido" }
    }

    const { data, error } = await supabase
      .from("materiasprimasxformula")
      .select("formulaid")
      .eq("materiaprimaid", materiaprimaid)

    if (error) {
      console.error("Error en query obtenerFormulasIdsXMateriaprima:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.formulaid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerFormulasIdsXMateriaprima:", error)
    return { success: false, error: "Error interno del servidor" }
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
        error: "no se recibio el productoid a actualizar",
      }
    }

    const updateData: any = {}

    if (formData.get("producto")) updateData.producto = formData.get("producto") as string
    if (formData.get("presentacion")) updateData.presentacion = formData.get("presentacion") as string
    if (formData.get("formafarmaceuticaid"))
      updateData.formafarmaceuticaid = Number.parseInt(formData.get("formafarmaceuticaid") as string)
    if (formData.get("porcion")) updateData.porcion = formData.get("porcion") as string
    if (formData.get("sistemaid")) updateData.sistemaid = Number.parseInt(formData.get("sistemaid") as string)
    if (formData.get("codigomaestro")) updateData.codigomaestro = formData.get("codigomaestro") as string
    if (formData.get("envase")) updateData.envase = formData.get("envase") as string
    if (formData.get("envaseml")) updateData.envaseml = formData.get("envaseml") as string

    if (formData.get("codigo")) updateData.codigo = formData.get("codigo") as string
    if (formData.get("nombre")) updateData.nombre = formData.get("nombre") as string
    if (formData.get("clienteid")) updateData.clienteid = Number.parseInt(formData.get("clienteid") as string)
    if (formData.get("zonaid")) updateData.zonaid = Number.parseInt(formData.get("zonaid") as string)
    if (formData.get("unidadmedidaid"))
      updateData.unidadmedidaid = Number.parseInt(formData.get("unidadmedidaid") as string)
    if (formData.get("costo")) updateData.costo = Number.parseFloat(formData.get("costo") as string)
    if (formData.get("activo") !== null) updateData.activo = formData.get("activo") === "true"

    if (formData.get("mp_porcentaje")) {
      const mpValue = formData.get("mp_porcentaje") as string
      updateData.mp_porcentaje = Number.parseFloat(mpValue) / 100
    }
    if (formData.get("mem_porcentaje")) {
      const memValue = formData.get("mem_porcentaje") as string
      updateData.mem_porcentaje = Number.parseFloat(memValue) / 100
    }
    if (formData.get("me_porcentaje")) {
      const meValue = formData.get("me_porcentaje") as string
      updateData.me_porcentaje = Number.parseFloat(meValue) / 100
    }
    if (formData.get("ms_porcentaje")) {
      const msValue = formData.get("ms_porcentaje") as string
      updateData.ms_porcentaje = Number.parseFloat(msValue) / 100
    }

    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, formData.get("codigo") as string, "productos")

      if (resultadoImagen.success && resultadoImagen.url) {
        updateData.imgurl = resultadoImagen.url
      }
    }

    const { error } = await supabase.from("productos").update(updateData).eq("id", productoid)

    if (error) {
      console.error("Error actualizando producto en app/actions/productos en actualizarProducto:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath("/productos")
    return {
      success: true,
      error: false,
    }
  } catch (error) {
    console.error("Error en app/actions/productos en actualizarProducto:", error)
    return {
      success: false,
      error: "Error interno del servidor",
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
      console.error(
        "Error actualizando relación producto-catálogo en app/actions/productos en actualizarProductoXCatalogo:",
        error,
      )
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
  PorcentajeGeneracional: number,
  PorcentajeNivel: number,
  PorcentajeInfinito: number,
  PorcentajeIva: number,
  PorcentajeBonoRapido: number,
  PorcentajeCDA: number,
  PorcentajeConstructor: number,
  PorcentajeRuta: number,
  PorcentajeReembolsos: number,
  PorcentajeTarjeta: number,
  PorcentajeEnvio: number,
  ConversionMoneda: number,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("actualizarcotizacion", {
      productosid,
      clientesid,
      preciosiniva,
      forecasts,
      porcentajegeneracional: PorcentajeGeneracional,
      porcentajenivel: PorcentajeNivel,
      porcentajeinfinito: PorcentajeInfinito,
      porcentajeiva: PorcentajeIva,
      porcentajebonorapido: PorcentajeBonoRapido,
      porcentajecda: PorcentajeCDA,
      porcentajeconstructor: PorcentajeConstructor,
      porcentajeruta: PorcentajeRuta,
      porcentajereembolsos: PorcentajeReembolsos,
      porcentajetarjeta: PorcentajeTarjeta,
      porcentajeenvio: PorcentajeEnvio,
      conversionmoneda: ConversionMoneda,
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

// Función: recalcularProducto: Función para recalcular todos los costos de un producto
export async function recalcularProducto(productoid: number): Promise<{ success: boolean; error: string | false }> {
  try {
    if (!productoid || productoid <= 0) {
      return {
        success: false,
        error:
          "No se recibieron los parametros necesarios para ejecuta la funcion recalcularProducto de app/actions/productos",
      }
    }

    const { data: productoData, error: productoError } = await supabase
      .from("productos")
      .select("mp_porcentaje, mem_porcentaje, me_porcentaje, ms_porcentaje")
      .eq("id", productoid)
      .single()

    if (productoError || !productoData) {
      console.error("Error obteniendo porcentajes del producto:", productoError)
      return { success: false, error: productoError?.message || "Producto no encontrado" }
    }

    const mp_porcentaje = productoData.mp_porcentaje || 0.35
    const mem_porcentaje = productoData.mem_porcentaje || 0.35
    const me_porcentaje = productoData.me_porcentaje || 0.35
    const ms_porcentaje = productoData.ms_porcentaje || 0.35

    const { data: formulasData, error: formulasError } = await supabase
      .from("formulasxproducto")
      .select(
        `
        formulaid,
        cantidad,
        formulas!formulaid(costo)
      `,
      )
      .eq("productoid", productoid)

    if (formulasError) {
      console.error("Error obteniendo formulas relacionadas:", formulasError)
      return { success: false, error: formulasError.message }
    }

    if (formulasData && formulasData.length > 0) {
      for (const formula of formulasData) {
        const cantidad = formula.cantidad || 0
        const costo = (formula.formulas as any)?.costo || 0
        const costoparcial = cantidad * costo

        const { error: updateError } = await supabase
          .from("formulasxproducto")
          .update({ costoparcial })
          .eq("formulaid", formula.formulaid)
          .eq("productoid", productoid)

        if (updateError) {
          console.error("Error actualizando costoparcial de formula:", updateError)
        }
      }
    }

    const { data: mpSumData, error: mpSumError } = await supabase
      .from("formulasxproducto")
      .select("costoparcial")
      .eq("productoid", productoid)

    if (mpSumError) {
      console.error("Error obteniendo suma de costoparcial de formulas:", mpSumError)
      return { success: false, error: mpSumError.message }
    }

    const mp = mpSumData?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0

    const mp_costeado = mp_porcentaje > 0 ? mp / mp_porcentaje : 0

    const { error: updateMpError } = await supabase.from("productos").update({ mp, mp_costeado }).eq("id", productoid)

    if (updateMpError) {
      console.error("Error actualizando mp y mp_costeado:", updateMpError)
      return { success: false, error: updateMpError.message }
    }

    const { data: materialesData, error: materialesError } = await supabase
      .from("materialesetiquetadoxproducto")
      .select(
        `
        materialetiquetadoid,
        cantidad,
        materialesetiquetado!materialetiquetadoid(costo)
      `,
      )
      .eq("productoid", productoid)

    if (materialesError) {
      console.error("Error obteniendo materiales etiquetado relacionados:", materialesError)
      return { success: false, error: materialesError.message }
    }

    if (materialesData && materialesData.length > 0) {
      for (const material of materialesData) {
        const cantidad = material.cantidad || 0
        const costo = (material.materialesetiquetado as any)?.costo || 0
        const costoparcial = cantidad * costo

        const { error: updateError } = await supabase
          .from("materialesetiquetadoxproducto")
          .update({ costoparcial })
          .eq("materialetiquetadoid", material.materialetiquetadoid)
          .eq("productoid", productoid)

        if (updateError) {
          console.error("Error actualizando costoparcial de material etiquetado:", updateError)
        }
      }
    }

    const { data: memSumData, error: memSumError } = await supabase
      .from("materialesetiquetadoxproducto")
      .select(
        `
              costoparcial,
              materialesetiquetado!inner(tipomaterialid)
              `,
      )
      .eq("productoid", productoid)
      .eq("materialesetiquetado.tipomaterialid", 1)

    if (memSumError) {
      console.error("Error obteniendo suma de costoparcial de materiales etiquetado MEM:", memSumError)
      return { success: false, error: memSumError.message }
    }

    const mem = memSumData?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0

    const mem_costeado = mem_porcentaje > 0 ? mem / mem_porcentaje : 0

    const { error: updateMemError } = await supabase
      .from("productos")
      .update({ mem, mem_costeado })
      .eq("id", productoid)

    if (updateMemError) {
      console.error("Error actualizando mem y mem_costeado:", updateMemError)
      return { success: false, error: updateMemError.message }
    }

    const { data: meSumData, error: meSumError } = await supabase
      .from("materialesetiquetadoxproducto")
      .select(
        `
              costoparcial,
              materialesetiquetado!inner(tipomaterialid)
              `,
      )
      .eq("productoid", productoid)
      .eq("materialesetiquetado.tipomaterialid", 2)

    if (meSumError) {
      console.error("Error obteniendo suma de costoparcial de materiales etiquetado:", meSumError)
      return { success: false, error: meSumError.message }
    }

    const me = meSumData?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0

    const me_costeado = me_porcentaje > 0 ? me / me_porcentaje : 0

    const { error: updateMeError } = await supabase.from("productos").update({ me, me_costeado }).eq("id", productoid)

    if (updateMeError) {
      console.error("Error actualizando me y me_costeado:", updateMeError)
      return { success: false, error: updateMeError.message }
    }

    const ms = (mp + mem + me) * 0.05

    const ms_costeado = ms_porcentaje > 0 ? ms / ms_porcentaje : 0

    const { error: updateMsError } = await supabase.from("productos").update({ ms, ms_costeado }).eq("id", productoid)

    if (updateMsError) {
      console.error("Error actualizando ms y ms_costeado:", updateMsError)
      return { success: false, error: updateMsError.message }
    }

    const costoelaboracion = mp + mem + me + ms

    const preciohl = mp_costeado + mem_costeado + me_costeado + ms_costeado

    const preciohlFinal = preciohl <= 50.0 ? 50.0 : preciohl
    const utilidadhlFinal = preciohlFinal - costoelaboracion

    const { error: updateFinalError } = await supabase
      .from("productos")
      .update({
        costo: costoelaboracion,
        preciohl: preciohlFinal,
        utilidadhl: utilidadhlFinal,
      })
      .eq("id", productoid)

    if (updateFinalError) {
      console.error("Error actualizando costo, preciohl y utilidadhl:", updateFinalError)
      return { success: false, error: updateFinalError.message }
    }

    // Get clienteid for the product
    const { data: productoInfo, error: productoInfoError } = await supabase
      .from("productos")
      .select("clienteid")
      .eq("id", productoid)
      .single()

    if (!productoInfoError && productoInfo) {
      const clientesid = productoInfo.clienteid

      // Execute recalcularcosteogeneral function
      const { data: recalcularData, error: recalcularError } = await supabase.rpc("recalcularcosteogeneral", {
        productosid: productoid,
        clientesid: clientesid,
      })

      if (recalcularError) {
        console.error("Error ejecutando recalcularcosteogeneral:", recalcularError)
        // Don't return error, just log it - we want to complete the update even if this fails
      }
    }

    revalidatePath("/productos")
    return { success: true, error: false }
  } catch (error) {
    console.error("Error en app/actions/productos en recalcularProducto:", error)
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
// Función: estatusActivoProducto / actProducto: FUNCION que cambia la columna activo a true(activo) o false(inactivo) del producto
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

// Función: listadopresentacion: Obtiene listado único de presentaciones de productos
export async function listadopresentacion(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("presentacionproducto")
      .not("presentacionproducto", "is", null)
      .order("presentacionproducto", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const presentaciones = [...new Set(data.map(item => item.presentacionproducto))]
    
    return { success: true, data: presentaciones }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadotipocomision: Obtiene listado único de categorías de productos
export async function listadotipocomision(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("categoria")
      .not("categoria", "is", null)
      .neq("categoria", "-")
      .order("categoria", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const categorias = [...new Set(data.map(item => item.categoria))]
    
    return { success: true, data: categorias }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadofrecuencia: Obtiene listado único de frecuencias de productos
export async function listadofrecuencia(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("frecuencia")
      .not("frecuencia", "is", null)
      .neq("frecuencia", "-")
      .order("frecuencia", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const frecuencias = [...new Set(data.map(item => item.frecuencia))]
    
    return { success: true, data: frecuencias }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadoformula: Obtiene listado único de fórmulas
export async function listadoformula(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select("formula")
      .not("formula", "is", null)
      .neq("formula", "-")
      .order("formula", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const formulas = [...new Set(data.map(item => item.formula))]
    
    return { success: true, data: formulas }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadomedidaformula: Obtiene listado único de medidas de fórmulas
export async function listadomedidaformula(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select("medida")
      .not("medida", "is", null)
      .neq("medida", "-")
      .order("medida", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const medidas = [...new Set(data.map(item => item.medida))]
    
    return { success: true, data: medidas }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadofamiliamaterialempaque: Obtiene listado único de familias de materiales
export async function listadofamiliamaterialempaque(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .select("familia")
      .not("familia", "is", null)
      .neq("familia", "-")
      .order("familia", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const familias = [...new Set(data.map(item => item.familia))]
    
    return { success: true, data: familias }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadopais: Obtiene listado único de países de materiales
export async function listadopais(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .select("pais")
      .not("pais", "is", null)
      .neq("pais", "-")
      .order("pais", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const paises = [...new Set(data.map(item => item.pais))]
    
    return { success: true, data: paises }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadomedidaempaque: Obtiene listado único de medidas (detalle) de materiales
export async function listadomedidaempaque(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .select("detalle")
      .not("detalle", "is", null)
      .neq("detalle", "-")
      .order("detalle", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const medidas = [...new Set(data.map(item => item.detalle))]
    
    return { success: true, data: medidas }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadocolorempaque: Obtiene listado único de colores de materiales
export async function listadocolorempaque(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .select("color")
      .not("color", "is", null)
      .neq("color", "-")
      .order("color", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const colores = [...new Set(data.map(item => item.color))]
    
    return { success: true, data: colores }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadofamiliamateriaprima: Obtiene listado único de familias de materias primas
export async function listadofamiliamateriaprima(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materiasprima")
      .select("familia")
      .not("familia", "is", null)
      .neq("familia", "-")
      .order("familia", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const familias = [...new Set(data.map(item => item.familia))]
    
    return { success: true, data: familias }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadopresentacionmateriaprima: Obtiene listado único de presentaciones de materias primas
export async function listadopresentacionmateriaprima(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materiasprima")
      .select("presentacion")
      .not("presentacion", "is", null)
      .neq("presentacion", "-")
      .order("presentacion", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const presentaciones = [...new Set(data.map(item => item.presentacion))]
    
    return { success: true, data: presentaciones }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadocodigomaestro: Obtiene listado único de códigos maestros de productos
export async function listadocodigomaestro(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("codigomaestro")
      .not("codigomaestro", "is", null)
      .neq("codigomaestro", "-")
      .order("codigomaestro", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const codigosMaestros = [...new Set(data.map(item => item.codigomaestro))]
    
    return { success: true, data: codigosMaestros }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadocodigo: Obtiene listado único de códigos de productos
export async function listadocodigo(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("codigo")
      .not("codigo", "is", null)
      .order("codigo", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const codigos = [...new Set(data.map(item => item.codigo))]
    
    return { success: true, data: codigos }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadocodigointerno: Obtiene listado único de códigos internos de productos
export async function listadocodigointerno(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("codigointerno")
      .not("codigointerno", "is", null)
      .order("codigointerno", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const codigosInternos = [...new Set(data.map(item => item.codigointerno))]
    
    return { success: true, data: codigosInternos }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadonombrematerial: Obtiene listado único de nombres de materiales
export async function listadonombrematerial(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .select("nombre")
      .not("nombre", "is", null)
      .order("nombre", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const nombres = [...new Set(data.map(item => item.nombre))]
    
    return { success: true, data: nombres }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadocodigomaterial: Obtiene listado único de códigos de materiales
export async function listadocodigomaterial(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .select("codigo")
      .not("codigo", "is", null)
      .order("codigo", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const codigos = [...new Set(data.map(item => item.codigo))]
    
    return { success: true, data: codigos }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadodetallematerial: Obtiene listado único de detalles de materiales
export async function listadodetallematerial(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .select("detalle")
      .not("detalle", "is", null)
      .order("detalle", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const detalles = [...new Set(data.map(item => item.detalle))]
    
    return { success: true, data: detalles }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadoespecificacionesmaterial: Obtiene listado único de especificaciones de materiales
export async function listadoespecificacionesmaterial(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materialesetiquetado")
      .select("especificaciones")
      .not("especificaciones", "is", null)
      .order("especificaciones", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener valores únicos
    const especificaciones = [...new Set(data.map(item => item.especificaciones))]
    
    return { success: true, data: especificaciones }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadonombresformulas: Obtiene listado único de nombres de fórmulas
export async function listadonombresformulas(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select("nombre")
      .not("nombre", "is", null)
      .order("nombre", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const nombres = [...new Set(data.map(item => item.nombre))]
    return { success: true, data: nombres }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadocodigosformulas: Obtiene listado único de códigos de fórmulas
export async function listadocodigosformulas(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select("codigo")
      .not("codigo", "is", null)
      .order("codigo", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const codigos = [...new Set(data.map(item => item.codigo))]
    return { success: true, data: codigos }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadoespecificacionesformulas: Obtiene listado único de especificaciones de fórmulas
export async function listadoespecificacionesformulas(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select("especificaciones")
      .not("especificaciones", "is", null)
      .order("especificaciones", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const especificaciones = [...new Set(data.map(item => item.especificaciones))]
    return { success: true, data: especificaciones }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadonombresmateriaspri: Obtiene listado único de nombres de materias primas
export async function listadonombresmateriaspri(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materiasprima")
      .select("nombre")
      .not("nombre", "is", null)
      .order("nombre", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const nombres = [...new Set(data.map(item => item.nombre))]
    return { success: true, data: nombres }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadocodigosmateriaspri: Obtiene listado único de códigos de materias primas
export async function listadocodigosmateriaspri(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materiasprima")
      .select("codigo")
      .not("codigo", "is", null)
      .order("codigo", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const codigos = [...new Set(data.map(item => item.codigo))]
    return { success: true, data: codigos }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadofamiliasmateriaspri: Obtiene listado único de familias de materias primas
export async function listadofamiliasmateriaspri(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materiasprima")
      .select("familia")
      .not("familia", "is", null)
      .order("familia", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const familias = [...new Set(data.map(item => item.familia))]
    return { success: true, data: familias }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadoespecificacionesmateriaspri: Obtiene listado único de especificaciones de materias primas
export async function listadoespecificacionesmateriaspri(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materiasprima")
      .select("especificaciones")
      .not("especificaciones", "is", null)
      .order("especificaciones", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const especificaciones = [...new Set(data.map(item => item.especificaciones))]
    return { success: true, data: especificaciones }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listadopresentacionesmateriaspri: Obtiene listado único de presentaciones de materias primas
export async function listadopresentacionesmateriaspri(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("materiasprima")
      .select("materia")
      .not("materia", "is", null)
      .order("materia", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const presentaciones = [...new Set(data.map(item => item.materiapresentacion))]
    return { success: true, data: presentaciones }
  } catch (error) {
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableProductosXClientes: Lista de productos filtrados por cliente
export async function listaDesplegableProductosXClientes(
  clienteid: number,
  zonaid: number,
): Promise<{ success: boolean; data?: oProducto[]; error?: string }> {
  try {
    // Variable productos de tipo oProducto[]
    let productos: oProducto[] = []

    // Ejecutar la función obtenerProductos con los parámetros por default excepto clienteid
    const resultado = await obtenerProductos(
      -1, // productoid (default)
      "", // productonombre (default)
      clienteid, // clienteid (parámetro recibido)
      zonaid, // zonaid (default)
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

// Función: operacionUtilidadHL: Función para calcular la utilidad HL
export async function operacionUtilidadHL(productoId: number) {
  try {
    const { data: productoData, error: productoError } = await supabase
      .from("productos")
      .select("preciohl, costo")
      .eq("id", productoId)
      .single()

    if (productoError || !productoData) {
      console.error("Error obteniendo datos del producto:", productoError)
      return { success: false, error: productoError?.message || "Producto no encontrado" }
    }

    const preciohl = productoData.preciohl || 0
    const costo = productoData.costo || 0

    const utilidadhl = preciohl - costo

    const { error: updateError } = await supabase.from("productos").update({ utilidadhl }).eq("id", productoId)

    if (updateError) {
      console.error("Error actualizando utilidad HL:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/productos")
    return { success: true }
  } catch (error) {
    console.error("Error en operacionUtilidadHL:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: FiltrosAvanzados: Función para obtener filtros avanzados de productos
export async function FiltrosAvanzados() {
  try {
    const { data, error } = await supabase.rpc("filtrosavanzadosproductos")

    if (error) {
      console.error("Error en FiltrosAvanzados:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en app/actions/products en FiltrosAvanzados:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
