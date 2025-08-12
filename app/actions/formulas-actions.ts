"use server"
/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    - obtenerIngredientesPorCliente***
    - obtenerUnidadesMedida***
    - obtenerIngredientesFormula***
    - obtenerClientes***
    - getIngredientDetails***
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarFormula / updFormula
    - estatusActivoFormula / actFormula
  * DELETES-ELIMINAR (DELETES)
    - eliminarFormula / delFormula
    - eliminarIngredienteFormula***
  * SPECIALS-ESPECIALES ()
    - estadisticasFormulasTotales / statsFormlasTotales
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
        .from("herbax")
        .upload(fileName, formData.imagen)

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError)
        return { success: false, error: "Error al subir la imagen" }
      }

      // Obtener URL pública de la imagen
      const { data: urlData } = supabase.storage.from("herbax").getPublicUrl(fileName)

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
export async function crearFormulaEtapa2(formulaId: number, ingredienteId: number, cantidad: number, ingredientecostoparcial: number ) {
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

//Función: obtenerFormulas: funcion para obtener todas las formulas
export async function obtenerFormulas(page = 1, limit = 20) {
  const offset = (page - 1) * limit
  try {
    const {
      data: queryData,
      error: queryError,
      count,
    } = await supabase.rpc("get_formulas_with_details", {
      p_offset: offset,
      p_limit: limit,
    })

    // Alternative using raw SQL if RPC doesn't work
    const { data: rawData, error: rawError } = await supabase
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
        .from("imagenes")
        .upload(fileName, updateData.imagen)

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError)
        return { success: false, error: "Error al subir la imagen" }
      }

      // Obtener URL pública de la imagen
      const { data: urlData } = supabase.storage.from("imagenes").getPublicUrl(fileName)

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
