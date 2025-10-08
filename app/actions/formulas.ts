"use server"
/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { obtenerProductosXClientes } from "@/app/actions/productos"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  --------------------
  Objetos / Clases
  --------------------
  * Objetos
    - objetoFormula / oFormula (Individual)
    - objetoFormulas / oFormulas (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearFormula / insFormula
  * READS-OBTENER (SELECTS)
    - obtenerFormulas / selFormulas
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarFormula / updFormula    
  * DELETES-ELIMINAR (DELETES)
    - eliminarFormula / delFormula
  * SPECIALS-ESPECIALES ()
    - estatusActivoFormula / actFormula
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */

/*==================================================
    CREATES-CREAR (INSERTS)
================================================== */

/*==================================================
  READS-OBTENER (SELECTS)
================================================== */
//Función: obtenerFormulas: funcion para obtener todas las formulas
export async function obtenerFormulas(
  id = -1,
  codigo = "",
  nombre = "",
  activo = "Todos",
  clienteid = -1,
  productoid = -1,
) {
  try {
    // Paso 1: Obtener arrays de las formulasid que esten por cliente y/o por producto
    let IdsXCliente: number[] = []
    if (clienteid > 0) {
      const resultado = await obtenerFormulasXClientes(clienteid)
      if (resultado.success && resultado.data) {
        IdsXCliente = resultado.data
      }
    }

    let IdsXProducto: number[] = []
    if (productoid > 0) {
      const resultado = await obtenerFormulasXProductos(productoid)
      if (resultado.success && resultado.data) {
        IdsXProducto = resultado.data
      }
    }

    const IdsMerge: number[] = [...new Set([...IdsXCliente, ...IdsXProducto])]

    // Paso 2: Preparar Query
    let query = supabase.from("formulas").select(`
        id,
        codigo,
        nombre,
        imgurl,
        unidadmedidaid,
        unidadesmedida!unidadmedidaid(descripcion),
        costo,
        fechacreacion,
        activo
      `)

    // Paso 3: Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (codigo !== "") {
      query = query.ilike("codigo", `%${codigo}%`)
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
    if (IdsMerge.length > 0) {
      query = query.in("id", IdsMerge)
    }

    // Paso 4: Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Paso 5: Varaibles y resultados del query
    const { data, error } = await query

    // Error en query
    if (error) {
      console.error("Error obteniendo clientes en query en obtenerClientes de actions/clientes:", error)
      return { success: false, error: error.message }
    }

    // Paso 6: Retorno de data
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerClientes de actions/clientes:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar obtenerClientes de actions/clientes" }
  }
}

//Función: obtenerFormulasXClientes / selFormulasXClientes, funcion para obtener en un array el listado de los ids de formulas
export async function obtenerFormulasXClientes(
  clienteid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (clienteid <= 0) {
      return { success: false, error: "ID de cliente inválido" }
    }

    let Ids: number[] = []
    if (clienteid > 0) {
      const resultado = await obtenerProductosXClientes(clienteid)
      if (resultado.success && resultado.data) {
        Ids = resultado.data
      }
    }

    const { data, error } = await supabase.from("formulasxproducto").select("formulaid").in("productoid", Ids)

    if (error) {
      console.error("Error en query obtenerFormulasXClientes:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const productosIds: number[] = data.map((item) => item.formulaid)

    return { success: true, data: productosIds }
  } catch (error) {
    console.error("Error en obtenerFormulasXClientes de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerFormulasXClientes de actions/formulas",
    }
  }
}

//Función: obtenerFormulasXProductos / selFormulasXProductos, funcion para obtener en un array el listado de los ids de formulas
export async function obtenerFormulasXProductos(
  productoid = -1,
): Promise<{ success: boolean; data?: number[]; error?: string }> {
  try {
    if (productoid <= 0) {
      return { success: false, error: "ID de producto inválido" }
    }

    const { data, error } = await supabase.from("formulasXproducto").select("formulaid").eq("productoid", productoid)

    if (error) {
      console.error("Error en query obtenerFormulasXProductos de actions/formulas:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const productosIds: number[] = data.map((item) => item.formulaid)

    return { success: true, data: productosIds }
  } catch (error) {
    console.error("Error en obtenerFormulasXProductos de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerFormulasXProductos de actions/formulas",
    }
  }
}

export async function obtenerFormulass(page = 1, limit = 20, clienteid = -1) {
  const offset = (page - 1) * limit
  try {
    /*
    const {
      data: queryData,
      error: queryError,
      count,
    } = await supabase.rpc("get_formulas_with_details", {
      p_offset: offset,
      p_limit: limit,
    })
    */

    // Alternative using raw SQL if RPC doesn't work
    let supabaseQuery = supabase.from("formulas").select(`
        id,
        nombre,
        notaspreparacion,
        costo,
        imgurl,
        activo,
        cantidad,
        unidadmedidaid,
        fechacreacion,
        ingredientesxformula!inner(
          ingredienteid,
          ingredientes!inner(
            clienteid,
            clientes!inner(
              nombre
            )
          )
        )
      `)

    if (clienteid > 0) {
      supabaseQuery = supabaseQuery.eq("ingredientesxformula.ingredientes.clienteid", clienteid)
    }

    const { data: rawData, error: rawError } = await supabaseQuery.range(offset, offset + limit - 1)

    if (rawError) {
      console.error("Error al obtener formulas:", rawError)
      return { data: null, error: rawError.message, totalCount: 0 }
    }

    // Mapear los datos para que coincidan con el tipo esperado
    const mappedData =
      rawData?.map((formula) => ({
        Folio: formula.id,
        Nombre: formula.nombre,
        NotasPreparacion: formula.notaspreparacion,
        Costo: formula.costo,
        Imagen: formula.imgurl,
        Activo: formula.activo,
        Cantidad: formula.cantidad,
        UnidadMedidaId: formula.unidadmedidaid,
        FechaCreacion: formula.fechacreacion,
        IngredienteId: formula.ingredientesxformula?.[0]?.ingredienteid,
        ClienteId: formula.ingredientesxformula?.[0]?.ingredientes?.clienteid,
        Cliente: formula.ingredientesxformula?.[0]?.ingredientes?.clientes?.nombre || "N/A",
      })) || []

    return { data: mappedData, error: null, totalCount: rawData?.length || 0 }
  } catch (error: any) {
    console.error("Error en obtenerFormulas:", error)
    return { data: null, error: error.message, totalCount: 0 }
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

/* ==================================================
  Funciones
  --------------------
	* CREATES-CREAR (INSERTS)
    - crearFormula / insFormula
    - crearFormulaEtapa2 / insFormulaEtapa2
  * READS-OBTENER (SELECTS)
    - obtenerFormulas / selFormulas
    - obtenerFormulasPorFiltros / selFormulasXFiltros
    - obtenerFormulaPorId / selFormulaXId
    - obtenerIngredientesPorCliente
    - obtenerUnidadesMedida
    - obtenerIngredientesFormula
    - obtenerClientes
    - getIngredientDetails
    - obtenerFormulaCompleta
    - obtenerDetallesFormula
    - obtenerIngredientesDeFormula
    - obtenerProductosDeFormula
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarFormula / updFormula
    - estatusActivoFormula / actFormula
    - actualizarFormulaEtapa1
  * DELETES-ELIMINAR (DELETES)
    - eliminarFormula / delFormula
    - eliminarIngredienteFormula
    - eliminarRegistroIncompleto
  * SPECIALS-ESPECIALES ()
    - estadisticasFormulasTotales / statsFormlasTotales
    - verificarIngredienteDuplicado
================================================== */
//Función: crearFormula: funcion para crear una formula
export async function crearFormula(formData: {
  nombre: string
  notaspreparacion: string
  costo: number
  activo: boolean
  cantidad: number
  unidadmedidaid: number
  imagen?: File
}) {
  try {
    let imgUrl = ""

    if (formData.imagen) {
      const fileName = `formula_${Date.now()}_${formData.imagen.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("herbax/formulas")
        .upload(fileName, formData.imagen)

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError)
        return { success: false, error: "Error al subir la imagen" }
      }

      // Obtener URL pública de la imagen
      const { data: urlData } = supabase.storage.from("herbax/formulas").getPublicUrl(fileName)

      imgUrl = urlData.publicUrl
    }

    const { data, error } = await supabase
      .from("formulas")
      .insert({
        nombre: formData.nombre,
        notaspreparacion: formData.notaspreparacion,
        costo: formData.costo,
        activo: formData.activo,
        cantidad: formData.cantidad,
        unidadmedidaid: formData.unidadmedidaid,
        imgurl: imgUrl,
        fechacreacion: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error al crear fórmula:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data[0],
      message: "Fórmula creada exitosamente",
    }
  } catch (error: any) {
    console.error("Error en crearFormula:", error)
    return { success: false, error: error.message }
  }
}

//Función: crearFormulaEtapa2: funcion para crear una formula pasando a la etapa 2 donde están las relaciones con los materiales
export async function crearFormulaEtapa2(
  formulaId: number,
  ingredienteId: number,
  cantidad: number,
  ingredientecostoparcial: number,
) {
  try {
    const CostoTotalParcial = ingredientecostoparcial * cantidad

    const { data, error } = await supabase
      .from("ingredientesxformula")
      .insert({
        formulaid: formulaId,
        ingredienteid: ingredienteId,
        cantidad: cantidad,
        ingredientecostoparcial: CostoTotalParcial,
        fechacreacion: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error al agregar ingrediente a fórmula:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data[0],
      message: "Ingrediente agregado a la fórmula exitosamente",
    }
  } catch (error: any) {
    console.error("Error en crearFormulaEtapa2:", error)
    return { success: false, error: error.message }
  }
}

//Función: obtenerFormulasPorFiltros: funcion para obtener todas las formulas por el filtrado
export async function obtenerFormulasPorFiltros(nombre = "", clienteId = "", activo = true, page = 1, limit = 20) {
  const offset = (page - 1) * limit
  try {
    let supabaseQuery = supabase
      .from("formulas")
      .select(`
        id,
        nombre,
        notaspreparacion,
        costo,
        imgurl,
        activo,
        cantidad,
        unidadmedidaid,
        fechacreacion,
        ingredientesxformula!inner(
          ingredienteid,
          ingredientes!inner(
            clienteid,
            clientes!inner(
              nombre
            )
          )
        )
      `)
      .range(offset, offset + limit - 1)
      .order("nombre", { ascending: true })

    // Solo aplicar filtro de nombre si tiene valor (no está vacío)
    if (nombre && nombre.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("nombre", `%${nombre}%`)
    }

    if (clienteId && clienteId !== 0) {
      supabaseQuery = supabaseQuery.eq("ingredientesxformula.ingredientes.clienteid", clienteId)
    }

    if (activo !== undefined) {
      supabaseQuery = supabaseQuery.eq("activo", activo)
    }

    const { data: queryData, error: queryError, count } = await supabaseQuery.range(offset, offset + limit - 1)

    if (queryError) {
      console.error("Error al obtener formulas:", queryError)
      return { data: null, error: queryError.message, totalCount: 0 }
    }

    // Mapear los datos para que coincidan con el tipo esperado
    const mappedData =
      queryData?.map((formula) => ({
        Folio: formula.id,
        Nombre: formula.nombre,
        NotasPreparacion: formula.notaspreparacion,
        Costo: formula.costo,
        Imagen: formula.imgurl,
        Activo: formula.activo,
        Cantidad: formula.cantidad,
        UnidadMedidaId: formula.unidadmedidaid,
        FechaCreacion: formula.fechacreacion,
        IngredienteId: formula.ingredientesxformula?.[0]?.ingredienteid,
        ClienteId: formula.ingredientesxformula?.[0]?.ingredientes?.clienteid,
        Cliente: formula.ingredientesxformula?.[0]?.ingredientes?.clientes?.nombre || "N/A",
      })) || []

    return { data: mappedData, error: null, totalCount: count || 0 }
  } catch (error: any) {
    console.error("Error en obtenerFormulasPorFiltros:", error)
    return { data: null, error: error.message, totalCount: 0 }
  }
}

//Función: obtenerFormulaPorId: funcion para obtener la formula por Id de la formula
export async function obtenerFormulaPorId(formulaId: number) {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select(`
        id,
        nombre,
        notaspreparacion,
        costo,
        imgurl,
        activo,
        cantidad,
        unidadmedidaid,
        fechacreacion,
        ingredientesxformula!inner(
          ingredienteid,
          ingredientes!inner(
            clienteid,
            clientes!inner(
              nombre
            )
          )
        )
      `)
      .eq("id", formulaId)

    if (error) {
      console.error("Error al obtener fórmula por ID:", error)
      return { data: null, error: error.message }
    }

    // Mapear los datos para que coincidan con el tipo esperado
    const mappedData =
      data?.map((formula) => ({
        Folio: formula.id,
        Nombre: formula.nombre,
        NotasPreparacion: formula.notaspreparacion,
        Costo: formula.costo,
        Imagen: formula.imgurl,
        Activo: formula.activo,
        Cantidad: formula.cantidad,
        UnidadMedidaId: formula.unidadmedidaid,
        FechaCreacion: formula.fechacreacion,
        IngredienteId: formula.ingredientesxformula?.[0]?.ingredienteid,
        ClienteId: formula.ingredientesxformula?.[0]?.ingredientes?.clienteid,
        Cliente: formula.ingredientesxformula?.[0]?.ingredientes?.clientes?.nombre || "N/A",
      })) || []

    return { data: mappedData[0], error: null }
  } catch (error: any) {
    console.error("Error en obtenerFormulaPorId:", error)
    return { data: null, error: error.message }
  }
}

//Función: actualizarFormula: funcion para actualizar la información de una formula por Id de la formula
export async function actualizarFormula(
  formulaId: number,
  updateData: {
    nombre?: string
    notaspreparacion?: string
    costo?: number
    activo?: boolean
    cantidad?: number
    unidadmedidaid?: number
    imagen?: File
  },
) {
  try {
    let imgUrl = ""

    if (updateData.imagen) {
      const fileName = `formula_${Date.now()}_${updateData.imagen.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("herbax/formulas")
        .upload(fileName, updateData.imagen)

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError)
        return { success: false, error: "Error al subir la imagen" }
      }

      // Obtener URL pública de la imagen
      const { data: urlData } = supabase.storage.from("herbax/formulas").getPublicUrl(fileName)

      imgUrl = urlData.publicUrl
    }

    const { data, error } = await supabase
      .from("formulas")
      .update({
        nombre: updateData.nombre,
        notaspreparacion: updateData.notaspreparacion,
        costo: updateData.costo,
        activo: updateData.activo,
        cantidad: updateData.cantidad,
        unidadmedidaid: updateData.unidadmedidaid,
        imgurl: imgUrl,
      })
      .eq("id", formulaId)
      .select()

    if (error) {
      console.error("Error al actualizar fórmula:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data[0],
      message: "Fórmula actualizada exitosamente",
    }
  } catch (error: any) {
    console.error("Error en actualizarFormula:", error)
    return { success: false, error: error.message }
  }
}

//Función: eliminarFormula: funcion para eliminar la información de una formula por Id de la formula
export async function eliminarFormula(formulaId: number) {
  try {
    const { error } = await supabase.from("formulas").delete().eq("id", formulaId)

    if (error) {
      console.error("Error al eliminar fórmula:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      message: "Fórmula eliminada exitosamente",
    }
  } catch (error: any) {
    console.error("Error en eliminarFormula:", error)
    return { success: false, error: error.message }
  }
}

// Función: estatusActivoFormula: función para cambiar el estatus de una formula por Id de la formula
export async function estatusActivoFormula(folio: number, estadoActual: boolean) {
  try {
    const nuevoEstado = !estadoActual

    const { data, error } = await supabase.from("formulas").update({ activo: nuevoEstado }).eq("id", folio).select()

    if (error) {
      console.error("Error al cambiar estado de fórmula:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data[0],
      nuevoEstado,
      message: `Fórmula ${nuevoEstado ? "activada" : "inactivada"} correctamente`,
    }
  } catch (error: any) {
    console.error("Error en estatusActivoFormula:", error)
    return { success: false, error: error.message }
  }
}

//Función: listaDesplegableFormulas: funcion para obtener todas las formulas para el input dropdownlist
export async function listaDesplegableFormulas() {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error al obtener formulas para dropdown:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en listaDesplegableFormulas:", error)
    return { data: null, error: error.message }
  }
}

//Función: estadisticasFormulasTotales: Función estadística para conocer el total de formulas registradas en la base de datos
export async function estadisticasFormulasTotales() {
  try {
    const { count, error } = await supabase
      .from("formulas")
      .select("id", { count: "exact", head: true })
      .eq("activo", true)

    if (error) {
      console.error("Error al obtener estadísticas de fórmulas:", error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error: any) {
    console.error("Error en estadisticasFormulasTotales:", error)
    return { count: 0, error: error.message }
  }
}

//Función: obtenerIngredientesPorCliente: funcion para obtener ingredientes por cliente
export async function obtenerIngredientesPorCliente(clienteId: number, cantidad: number) {
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select("id, codigo, nombre, costo, clienteid")
      .eq("clienteid", clienteId)
      .eq("activo", true)
      .order("nombre", { ascending: true })

    const CostoTotal = data.costo * cantidad

    if (error) {
      console.error("Error al obtener ingredientes:", error)
      return { data: null, error: error.message }
    }

    return { data, CostoTotal, error: null }
  } catch (error: any) {
    console.error("Error en obtenerIngredientesPorCliente:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerUnidadesMedida: funcion para obtener todas las unidades de medida
export async function obtenerUnidadesMedida() {
  try {
    const { data, error } = await supabase
      .from("tipounidadesmedida")
      .select("id, descripcion")
      .order("descripcion", { ascending: true })

    if (error) {
      console.error("Error al obtener unidades de medida:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerUnidadesMedida:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerIngredientesFormula: funcion para obtener ingredientes agregados a una fórmula
export async function obtenerIngredientesFormula(formulaId: number) {
  try {
    const { data, error } = await supabase
      .from("ingredientesxformula")
      .select(`
        id,
        cantidad,
        ingredientes!inner(
          id,
          nombre,
          costo,
          tipounidadesmedida!inner(
            id,
            descripcion
          )
        )
      `)
      .eq("formulaid", formulaId)

    if (error) {
      console.error("Error al obtener ingredientes de fórmula:", error)
      return { data: null, error: error.message }
    }

    // Mapear datos para coincidir con el formato esperado
    const mappedData =
      data?.map((item) => ({
        id: item.id,
        nombre: item.ingredientes.nombre,
        cantidad: item.cantidad,
        unidad: item.ingredientes.tipounidadesmedida.descripcion,
        ingredientecostoparcial: item.ingredientes.costo * item.cantidad,
      })) || []

    return { data: mappedData, error: null }
  } catch (error: any) {
    console.error("Error en obtenerIngredientesFormula:", error)
    return { data: null, error: error.message }
  }
}

//Función: eliminarIngredienteFormula: funcion para eliminar ingrediente de fórmula
export async function eliminarIngredienteFormula(ingredienteFormulaId: number) {
  try {
    const { error } = await supabase.from("ingredientesxformula").delete().eq("id", ingredienteFormulaId)

    if (error) {
      console.error("Error al eliminar ingrediente de fórmula:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      message: "Ingrediente eliminado de la fórmula exitosamente",
    }
  } catch (error: any) {
    console.error("Error en eliminarIngredienteFormula:", error)
    return { success: false, error: error.message }
  }
}

//Función: obtenerClientes: funcion para obtener todos los clientes
export async function obtenerClientes() {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error al obtener clientes:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerClientes:", error)
    return { data: null, error: error.message }
  }
}

//Función: getIngredientDetails: funcion para obtener detalles de un ingrediente por Id
export async function getIngredientDetails(ingredienteId: number) {
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select(`
        id,
        nombre,
        costo,
        tipounidadesmedida!inner(
          id,
          descripcion
        )
      `)
      .eq("id", ingredienteId)
      .single()

    if (error) {
      console.error("Error getting ingredient details:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data,
      unidadMedidaId: data.tipounidadesmedida?.id || null,
    }
  } catch (error: any) {
    console.error("Error in getIngredientDetails:", error)
    return { success: false, error: error.message }
  }
}

//Función: obtenerFormulaCompleta: función para obtener todos los datos de una fórmula para edición
export async function obtenerFormulaCompleta(formulaId: number) {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select(`
        id,
        nombre,
        notaspreparacion,
        costo,
        imgurl,
        activo,
        cantidad,
        unidadmedidaid,
        fechacreacion,
        ingredientesxformula(
          id,
          ingredienteid,
          cantidad,
          ingredientecostoparcial,
          ingredientes(
            id,
            nombre,
            costo,
            clienteid,
            tipounidadesmedida(
              id,
              descripcion
            )
          )
        )
      `)
      .eq("id", formulaId)
      .single()

    if (error) {
      console.error("Error al obtener fórmula completa:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerFormulaCompleta:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerDetallesFormula: función para obtener información básica de la fórmula
export async function obtenerDetallesFormula(formulaId: number) {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select(`
        nombre,
        imgurl,
        notaspreparacion,
        cantidad,
        activo,
        costo,
        tipounidadesmedida!inner(descripcion)
      `)
      .eq("id", formulaId)
      .single()

    if (error) {
      console.error("Error al obtener detalles de fórmula:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerDetallesFormula:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerIngredientesDeFormula: función para obtener ingredientes que conforman la fórmula
export async function obtenerIngredientesDeFormula(formulaId: number) {
  try {
    const { data, error } = await supabase
      .from("formulas")
      .select(`
        ingredientesxformula!inner(
          cantidad,
          ingredientecostoparcial,
          ingredientes!inner(
            imgurl,
            nombre,
            categoriasingredientes!inner(descripcion),
            tipounidadesmedida!inner(descripcion),
            costo
          )
        )
      `)
      .eq("id", formulaId)

    if (error) {
      console.error("Error al obtener ingredientes de fórmula:", error)
      return { data: null, error: error.message }
    }

    // Aplanar los datos para obtener la estructura esperada
    const ingredientes =
      data?.[0]?.ingredientesxformula?.map((item: any) => ({
        imgurl: item.ingredientes.imgurl,
        Ingrediente: item.ingredientes.nombre,
        Categoria: item.ingredientes.categoriasingredientes.descripcion,
        UnidadMedida: item.ingredientes.tipounidadesmedida.descripcion,
        costo: item.ingredientes.costo,
        cantidad: item.cantidad,
        ingredientecostoparcial: item.ingredientecostoparcial,
      })) || []

    return { data: ingredientes, error: null }
  } catch (error: any) {
    console.error("Error en obtenerIngredientesDeFormula:", error)
    return { data: null, error: error.message }
  }
}

//Función: obtenerProductosDeFormula: función para obtener productos asociados a la fórmula
export async function obtenerProductosDeFormula(formulaId: number) {
  try {
    // Primero obtener los detalles de productos asociados a la fórmula
    const { data: productosDetalles, error: detallesError } = await supabase
      .from("productosdetalles")
      .select("productoid, cantidad, costoparcial")
      .eq("elementoid", formulaId)
      .eq("tiposegmentoid", 1)

    if (detallesError) {
      console.error("Error al obtener detalles de productos:", detallesError)
      return { data: null, error: detallesError.message }
    }

    if (!productosDetalles || productosDetalles.length === 0) {
      return { data: [], error: null }
    }

    // Obtener los IDs de productos
    const productosIds = productosDetalles.map((detalle) => detalle.productoid)

    // Luego obtener la información de los productos
    const { data: productos, error: productosError } = await supabase
      .from("productos")
      .select("id, imgurl, nombre, presentacion, costo")
      .in("id", productosIds)

    if (productosError) {
      console.error("Error al obtener productos:", productosError)
      return { data: null, error: productosError.message }
    }

    // Combinar los datos manualmente
    const productosCompletos = productosDetalles.map((detalle) => {
      const producto = productos?.find((p) => p.id === detalle.productoid)
      return {
        imgurl: producto?.imgurl || "",
        Producto: producto?.nombre || "N/A",
        presentacion: producto?.presentacion || "N/A",
        costo: producto?.costo || 0,
        cantidad: detalle.cantidad,
        costoparcial: detalle.costoparcial,
      }
    })

    return { data: productosCompletos, error: null }
  } catch (error: any) {
    console.error("Error en obtenerProductosDeFormula:", error)
    return { data: null, error: error.message }
  }
}

//Función: actualizarFormulaEtapa1: función para actualizar información básica de la fórmula
export async function actualizarFormulaEtapa1(
  formulaId: number,
  formData: {
    nombre: string
    notaspreparacion: string
    cantidad: number
    unidadmedidaid: number
    imagen?: File
  },
) {
  try {
    const updateData: any = {
      nombre: formData.nombre,
      notaspreparacion: formData.notaspreparacion,
      cantidad: formData.cantidad,
      unidadmedidaid: formData.unidadmedidaid,
    }

    if (formData.imagen) {
      const fileName = `formula_${Date.now()}_${formData.imagen.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("herbax/formulas")
        .upload(fileName, formData.imagen)

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError)
        return { success: false, error: "Error al subir la imagen" }
      }

      const { data: urlData } = supabase.storage.from("herbax/formulas").getPublicUrl(fileName)
      updateData.imgurl = urlData.publicUrl
    }

    const { data, error } = await supabase.from("formulas").update(updateData).eq("id", formulaId).select()

    if (error) {
      console.error("Error al actualizar fórmula etapa 1:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data[0],
      message: "Información básica actualizada exitosamente",
    }
  } catch (error: any) {
    console.error("Error en actualizarFormulaEtapa1:", error)
    return { success: false, error: error.message }
  }
}

//Función: verificarIngredienteDuplicado: función para verificar si un ingrediente ya está en la fórmula
export async function verificarIngredienteDuplicado(formulaId: number, ingredienteId: number) {
  try {
    const { data, error } = await supabase
      .from("ingredientesxformula")
      .select("id")
      .eq("formulaid", formulaId)
      .eq("ingredienteid", ingredienteId)

    if (error) {
      console.error("Error al verificar ingrediente duplicado:", error)
      return { exists: false, error: error.message }
    }

    return { exists: data && data.length > 0, error: null }
  } catch (error: any) {
    console.error("Error en verificarIngredienteDuplicado:", error)
    return { exists: false, error: error.message }
  }
}

//Función: eliminarRegistroIncompleto: función para eliminar registros incompletos cuando el usuario sale del proceso
export async function eliminarRegistroIncompleto(formulaId: number) {
  try {
    const { data: formulaData, error: formulaQueryError } = await supabase
      .from("formulas")
      .select("imgurl")
      .eq("id", formulaId)
      .single()

    if (formulaQueryError) {
      console.error("Error al obtener datos de fórmula:", formulaQueryError)
      return { success: false, error: formulaQueryError.message }
    }

    if (formulaData?.imgurl) {
      try {
        const url = new URL(formulaData.imgurl)
        const pathSegments = url.pathname.split("/")

        // Buscar el segmento que contiene el nombre del archivo (después de 'formulas')
        const formulasIndex = pathSegments.findIndex((segment) => segment === "formulas")
        if (formulasIndex !== -1 && formulasIndex < pathSegments.length - 1) {
          // Tomar el nombre del archivo que está después de 'formulas'
          const fileName = pathSegments[formulasIndex + 1]
          console.log("Intentando eliminar archivo:", fileName)

          // Eliminar la imagen del bucket herbax con el path completo
          const { error: deleteImageError } = await supabase.storage.from("herbax").remove([`formulas/${fileName}`])

          if (deleteImageError) {
            console.error("Error al eliminar imagen:", deleteImageError)
            // No retornamos error aquí para que continúe con la eliminación de registros
          } else {
            console.log("Imagen eliminada exitosamente")
          }
        } else {
          console.log("No se pudo extraer el nombre del archivo de la URL")
        }
      } catch (imageError) {
        console.error("Error al procesar eliminación de imagen:", imageError)
        // Continuar con la eliminación de registros aunque falle la imagen
      }
    }

    // Primero eliminar los ingredientes asociados a la fórmula
    const { error: ingredientesError } = await supabase.from("ingredientesxformula").delete().eq("formulaid", formulaId)

    if (ingredientesError) {
      console.error("Error al eliminar ingredientes de fórmula:", ingredientesError)
      return { success: false, error: ingredientesError.message }
    }

    // Luego eliminar la fórmula
    const { error: formulaError } = await supabase.from("formulas").delete().eq("id", formulaId)

    if (formulaError) {
      console.error("Error al eliminar fórmula:", formulaError)
      return { success: false, error: formulaError.message }
    }

    return {
      success: true,
      message: "Registro incompleto eliminado exitosamente",
    }
  } catch (error: any) {
    console.error("Error en eliminarRegistroIncompleto:", error)
    return { success: false, error: error.message }
  }
}
