"use server"

/* ==================================================
  Imports
================================================== */
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase"
import { arrActivoTrue, arrActivoFalse } from "@/lib/config"
import { obtenerProductosXClientes } from "@/app/actions/productos"
import { imagenSubir } from "@/app/actions/utilerias"
import type { oFormula, oMateriasPrimasXFormula, oFormulasXFormula, ddlItem } from "@/types/formulas.types"

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
  * INSERTS: CREATE/CREAR/INSERT
    - crearFormula / insFormula
    - crearFormulaXProducto
    - crearFormulaXFormula
  
  * SELECTS: READ/OBTENER/SELECT
    - obtenerFormulas / selFormulas
    - obtenerFormulasXClientes / selFormulasXClientes
    - obtenerFormulasXProductos / selFormulasXProductos
    - obtenerMateriasPrimasXFormula: Función para obtener materias primas relacionadas a una formula
    - obtenerFormulasXFormula: Función para obtener formulas relacionadas a una formula
    - listaDesplegableFormulasBuscar
    - obtenerProductosXFormulas: Función para obtener productos relacionados a una formula
    - obtenerFormulasIdsXMateriaprima: Función para obtener en un array el listado de los ids de formulas
  
  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarFormula / updFormula    
  
  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarFormula / delFormula
    - eliminarFormulaXFormula
    - eliminarFormulaXProducto
  
  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - listaDesplegableFormulas / ddlFormulas
    - estadisticasFormulas / statsFormulas
    - recalcularFormula / recalcularFormula
    - copiarComposicionFormula: Función para copiar materias primas y formulas de una formula base a una nueva
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoFormula / oFormula (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoFormula(
  formulaid = -1,
  codigo = "",
  nombre = "",
  activo = "Todos",
  clienteid = -1,
  productoid = -1,
): Promise<{ success: boolean; data?: oFormula; error?: string }> {
  try {
    const resultado = await obtenerFormulas(formulaid, codigo, nombre, activo, clienteid, productoid)

    if (!resultado.success || !resultado.data) {
      return { success: false, error: resultado.error || "No se encontraron datos" }
    }

    if (resultado.data.length === 0) {
      return { success: false, error: "Formula no encontrada" }
    }

    const formula: oFormula = resultado.data[0] as oFormula

    return { success: true, data: formula }
  } catch (error) {
    console.error("Error en app/actions/formulas en objetoFormula (Individual):", error)
    return {
      success: false,
      error: "Error interno del servidor al ejecutar objetoFormula de app/actions/formula, " + error,
    }
  }
}

// Función: objetoFormulas / oFormulas (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoFormulas(
  formulaid = -1,
  codigo = "",
  nombre = "",
  activo = "Todos",
  clienteid = -1,
  productoid = -1,
): Promise<{ success: boolean; data?: oFormula[]; error?: string }> {
  try {
    const resultado = await obtenerFormulas(formulaid, codigo, nombre, activo, clienteid, productoid)

    if (!resultado.success || !resultado.data) {
      return { success: false, error: resultado.error || "No se encontraron datos" }
    }

    const formulas: oFormula[] = resultado.data as oFormula[]

    return { success: true, data: formulas }
  } catch (error) {
    console.error("Error en app/actions/formulas en objetoFormulas (Listado/Array):", error)
    return {
      success: false,
      error: "Error interno del servidor, al momento de ejecutar objetoFormulas de app/Actions/formulas, " + error,
    }
  }
}

/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función crearFormula / insFormula: Función para insertar
export async function crearFormula(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const codigo = (formData.get("codigo") as string)?.trim()
    const nombre = (formData.get("nombre") as string)?.trim()
    const unidadmedidaid = Number.parseInt(formData.get("unidadmedidaid") as string) || 0
    const imagen = formData.get("imagen") as File
    const costo = Number.parseFloat(formData.get("costo") as string) || 0
    const fecha = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
    const activo = true

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 2) {
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    const existe: boolean = await (async () => {
      const resultado = await obtenerFormulas(-1, codigo, nombre, "Todos", -1, -1)
      return resultado.success && resultado.data && resultado.data.length >= 1
    })()
    if (existe) {
      return { success: false, error: "La formula que se intenta ingresar ya existe y no se puede proceder." }
    }

    // Paso 4: Subir imagen para obtener su url
    let imagenurl = ""
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "formulas")
      if (resultadoImagen.success) {
        imagenurl = resultadoImagen.url || ""
      } else {
        return { success: false, error: resultadoImagen.error }
      }
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase
      .from("formulas")
      .insert({
        codigo,
        nombre,
        imgurl: imagenurl,
        unidadmedidaid,
        costo,
        fechacreacion: fecha,
        activo,
      })
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error("Error creando formula en query en crearFormula de actions/formulas: ", error)
      return {
        success: false,
        error: "Error creando formula en query en crearFormula de actions/formulas: " + error.message,
      }
    }

    revalidatePath("/formulas")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    // Retorno de información
    console.error("Error en crearFormula de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion crearFormula de actions/formulas: " + error,
    }
  }
}

// Función crearFormulaXProducto: Función para crear relación entre formula y producto
export async function crearFormulaXProducto(formulaid: number, productoid: number, cantidad: number) {
  try {
    // Paso 1: Validar parámetros
    if (!formulaid || formulaid <= 0 || !productoid || productoid <= 0 || !cantidad || cantidad <= 0) {
      return {
        success: false,
        error:
          "No se recibieron los parametros necesario para poder proceder en ejecutar la funcion crearFormulaXProducto en app/actions/formulas",
      }
    }

    // Paso 2: Obtener costo unitario de la formula
    const { data: formulaData, error: formulaError } = await supabase
      .from("formulas")
      .select("costo")
      .eq("id", formulaid)
      .single()

    if (formulaError || !formulaData) {
      console.error("Error obteniendo costo de formula en crearFormulaXProducto:", formulaError)
      return { success: false, error: "Error obteniendo costo de formula: " + formulaError?.message }
    }

    const costounitario = formulaData.costo || 0

    // Paso 3: Calcular costo parcial
    const costoparcial = cantidad * costounitario

    // Paso 4: Insertar en formulasxproducto
    const fechaActual = new Date().toISOString().split("T")[0]

    const { error: insertError } = await supabase.from("formulasxproducto").insert({
      productoid: productoid,
      formulaid: formulaid,
      cantidad: cantidad,
      costoparcial: costoparcial,
      fechacreacion: fechaActual,
      activo: true,
    })

    if (insertError) {
      console.error("Error insertando en formulasxproducto en crearFormulaXProducto:", insertError)
      return { success: false, error: "Error insertando relación: " + insertError.message }
    }

    revalidatePath("/productos")

    // Paso 5: Return resultados
    return { success: true }
  } catch (error) {
    console.error("Error en crearFormulaXProducto de actions/formulas: " + error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion crearFormulaXProducto de actions/formulas: " + error,
    }
  }
}

// Función crearFormulaXFormula: Función para crear relación entre formula secundaria y formula principal
export async function crearFormulaXFormula(secundariaid: number, formulaid: number, cantidad: number) {
  try {
    // Paso 1: Validar parámetros
    if (!secundariaid || secundariaid <= 0 || !formulaid || formulaid <= 0 || !cantidad || cantidad <= 0) {
      return {
        success: false,
        error:
          "No se recibieron los parametros necesario para poder proceder en ejecutar la funcion crearFormulaXFormula en app/actions/formulas",
      }
    }

    // Paso 2: Obtener costo unitario de la formula secundaria
    const { data: formulaData, error: formulaError } = await supabase
      .from("formulas")
      .select("costo")
      .eq("id", secundariaid)
      .single()

    if (formulaError || !formulaData) {
      console.error("Error obteniendo costo de formula en crearFormulaXFormula:", formulaError)
      return { success: false, error: "Error obteniendo costo de formula: " + formulaError?.message }
    }

    const costounitario = formulaData.costo || 0

    // Paso 3: Calcular costo parcial
    const costoparcial = cantidad * costounitario

    // Paso 4: Insertar en formulasxformula
    const fechaActual = new Date().toISOString().split("T")[0]

    const { error: insertError } = await supabase.from("formulasxformula").insert({
      formulaid: formulaid,
      secundariaid: secundariaid,
      cantidad: cantidad,
      costoparcial: costoparcial,
      fechacreacion: fechaActual,
      activo: true,
    })

    if (insertError) {
      console.error("Error insertando en formulasxformula en crearFormulaXFormula:", insertError)
      return { success: false, error: "Error insertando relación: " + insertError.message }
    }

    revalidatePath("/formulas")

    // Paso 5: Return resultados
    return { success: true }
  } catch (error) {
    console.error("Error en crearFormulaXFormula de actions/formulas: " + error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion crearFormulaXFormula de actions/formulas: " + error,
    }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
//Función: obtenerFormulas / selFormulas: Función para obtener
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
        materiasprimasxformula!formulaid(
          materiaprimaid,
          materiasprima!materiaprimaid(
            codigo,
            nombre,
            imgurl,
            unidadmedidaid,
            unidadesmedida!unidadmedidaid(descripcion),
            costo,
            factorimportacion,
            costoconfactorimportacion
          ),
          cantidad,
          costoparcial
        ),
        formulasxformula!formulaid(
          secundariaid,
          formulas!secundariaid(
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
      const isActive = arrActivoTrue.includes(activo)
      const isInactive = arrActivoFalse.includes(activo)
      if (isActive) {
        query = query.eq("activo", true)
      } else if (isInactive) {
        query = query.eq("activo", false)
      }
    }
    if (clienteid > 0 || productoid > 0) {
      if (IdsMerge.length > 0) {
        query = query.in("id", IdsMerge)
      }
    }

    // Paso 4: Ejecutar query
    query = query.order("nombre", { ascending: true })

    // Paso 5: Varaibles y resultados del query
    const { data, error } = await query

    // Error en query
    if (error) {
      console.error("Error obteniendo formulas en query en obtenerFormulas de actions/formulas:", error)
      return { success: false, error: error.message }
    }

    // Paso 6: Retorno de data
    return { success: true, data }
  } catch (error) {
    // Retorno de información
    console.error("Error en obtenerFormulas de actions/formulas:", error)
    return { success: false, error: "Error interno del servidor, al ejecutar obtenerFormulas de actions/formulas" }
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

    const DataIds: number[] = data.map((item) => item.formulaid)

    return { success: true, data: DataIds }
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

    const { data, error } = await supabase.from("formulasxproducto").select("formulaid").eq("productoid", productoid)

    if (error) {
      console.error("Error en query obtenerFormulasXProductos de actions/formulas:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    const DataIds: number[] = data.map((item) => item.formulaid)

    return { success: true, data: DataIds }
  } catch (error) {
    console.error("Error en obtenerFormulasXProductos de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerFormulasXProductos de actions/formulas",
    }
  }
}

// Función: obtenerMateriasPrimasXFormula: Función para obtener materias primas relacionadas a una formula
export async function obtenerMateriasPrimasXFormula(
  formulaid: number,
): Promise<{ success: boolean; data?: oMateriasPrimasXFormula; error?: string }> {
  try {
    // Paso 1: Validar parámetro
    if (!formulaid || formulaid < 1) {
      return {
        success: false,
        error:
          "No se recibio el parametro necesario, favor de verificar, al momento de ejecutar la funcion obtenerMaterisPrimasXFormula de app/actions/formulas",
      }
    }

    // Paso 2: Preparar y ejecutar Query
    let query = supabase.from("formulas").select(`
        id,
        codigo,
        nombre,
        imgurl,
        unidadmedidaid,
        unidadesmedida!unidadmedidaid(descripcion),
        materiasprimasxformula!formulaid(
          materiaprimaid,
          materiasprima:materiaprimaid(
            codigo,
            nombre,
            imgurl,
            unidadmedidaid,
            unidadesmedida!unidadmedidaid(descripcion),
            costo,
            factorimportacion,
            costoconfactorimportacion
          ),
          cantidad,
          costoparcial
        )
      `)

    // Paso 3: Aplicar filtro
    query = query.eq("id", formulaid)

    // Paso 4: Ejecutar query
    const { data, error } = await query.single()

    // Error en query
    if (error) {
      console.error("Error obteniendo materias primas x formula en obtenerMateriasPrimasXFormula:", error)
      return { success: false, error: error.message }
    }

    // Paso 5: Guardar resultado en variable con tipo
    const result: oMateriasPrimasXFormula = data as oMateriasPrimasXFormula

    // Paso 6: Retorno de data
    return { success: true, data: result }
  } catch (error) {
    console.error("Error en obtenerMateriasPrimasXFormula de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerMateriasPrimasXFormula de actions/formulas",
    }
  }
}

// Función: obtenerFormulasXFormula: Función para obtener formulas relacionadas a una formula
export async function obtenerFormulasXFormula(
  formulaid: number,
): Promise<{ success: boolean; data?: oFormulasXFormula; error?: string }> {
  try {
    // Paso 1: Validar parámetro
    if (!formulaid || formulaid < 1) {
      return {
        success: false,
        error:
          "No se recibio el parametro necesario, favor de verificar, al momento de ejecutar la funcion obtenerFormulasXFormula de app/actions/formulas",
      }
    }

    // Paso 2: Preparar y ejecutar Query
    let query = supabase.from("formulas").select(`
        id,
        codigo,
        nombre,
        imgurl,
        unidadmedidaid,
        unidadesmedida!unidadmedidaid(descripcion),
        formulasxformula!formulaid(
          secundariaid,
          formulas:secundariaid(
            codigo,
            nombre,
            imgurl,
            unidadmedidaid,
            unidadesmedida!unidadmedidaid(descripcion),
            costo
          ),
          cantidad,
          costoparcial
        )
      `)

    // Paso 3: Aplicar filtro
    query = query.eq("id", formulaid)

    // Paso 4: Ejecutar query
    const { data, error } = await query.single()

    // Error en query
    if (error) {
      console.error("Error obteniendo formulas x formula en obtenerFormulasXFormula:", error)
      return { success: false, error: error.message }
    }

    // Paso 5: Guardar resultado en variable con tipo
    const result: oFormulasXFormula = data as oFormulasXFormula

    // Paso 6: Retorno de data
    return { success: true, data: result }
  } catch (error) {
    console.error("Error en obtenerFormulasXFormula de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerFormulasXFormula de actions/formulas",
    }
  }
}

// Función: listaDesplegableFormulasBuscar: Función para buscar formulas en un dropdown
export async function listaDesplegableFormulasBuscar(buscar: string): Promise<ddlItem[]> {
  try {
    let query = supabase.from("formulas").select("id, codigo, nombre").eq("activo", true)

    // Apply filter: search in nombre OR codigo
    if (buscar && buscar.trim() !== "") {
      query = query.or(`nombre.ilike.%${buscar}%,codigo.ilike.%${buscar}%`)
    }

    // Order by nombre
    query = query.order("nombre", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo lista desplegable de formulas:", error)
      return []
    }

    // Map results to ddlItem format: value = id, text = "codigo - nombre"
    const items: ddlItem[] =
      data?.map((formula) => ({
        value: formula.id.toString(),
        text: `${formula.codigo} - ${formula.nombre}`,
      })) || []

    return items
  } catch (error) {
    console.error("Error en app/actions/formulas en listaDesplegableFormulasBuscar:", error)
    return []
  }
}

// Función: obtenerProductosXFormulas: Función para obtener productos relacionados a una formula
export async function obtenerProductosXFormulas(formulasid: number) {
  try {
    // Paso 1: Validar parámetro
    if (!formulasid || formulasid <= 0) {
      return {
        success: false,
        error: "ID de fórmula inválido",
      }
    }

    // Paso 2: Ejecutar función de Supabase
    const { data, error } = await supabase.rpc("productosxformulas", {
      formulasid: formulasid,
    })

    if (error) {
      console.error("Error en obtenerProductosXFormulas:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en obtenerProductosXFormulas de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerProductosXFormulas de actions/formulas",
    }
  }
}

// Función: obtenerFormulasIdsXMateriaprima: Función para obtener en un array el listado de los ids de formulas
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
    console.error("Error en obtenerFormulasIdsXMateriaprima de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar obtenerFormulasIdsXMateriaprima de actions/formulas",
    }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
//Función: actualizarFormula / updateFormula: Función para actualizar
export async function actualizarFormula(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const idString = formData.get("id") as string
    const id = Number(idString)
    const codigo = formData.get("codigo") as string
    const nombre = formData.get("nombre") as string
    const imgurl = formData.get("imgurl") as string | null
    const imagen = formData.get("imagen") as File
    const unidadmedidaid = Number.parseInt(formData.get("unidadmedidaid") as string) || null
    const costo = Number.parseFloat(formData.get("costo") as string) || 0

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 3) {
      return { success: false, error: "El parametro Nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 3: Validar si no existe
    /*
    const existe: boolean = await (async () => {
      const resultado = await obtenerFormulas(
        -1,
        formData.get("codigo") as string,
        formData.get("nombre") as string,
        "Todos",
        -1,
        -1,
      )
      if (resultado.success && resultado.data) {
        return resultado.data.some((formula: any) => formula.id !== id)
      }
      return false
    })()

    if (existe) {
      return {
        success: false,
        error:
          "Los datos que desea actualizar ya los tiene otro registro y no se puede proceder, recuerde que la información debe ser unica.",
      }
    }
    */

    // Paso 4: Subir imagen para obtener su url
    let imagenurl = ""
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "formulas")
      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error }
      } else {
        imagenurl = resultadoImagen.url || ""
      }
    } else {
      imagenurl = imgurl || ""
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase
      .from("formulas")
      .update({
        codigo,
        nombre,
        imgurl: imagenurl,
        unidadmedidaid,
        costo,
      })
      .eq("id", id)
      .select("id")
      .single()

    // Return error
    if (error) {
      console.error("Error actualizando formula en query en actualizarFormula de actions/formulas:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/formulas")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error) {
    console.error("Error en actualizarFormula de actions/formulas:", error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarFormula de actions/formulas",
    }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
//Función: eliminarFormula / delFormula: Función para eliminar
export async function eliminarFormula(id: number) {
  try {
    // Paso 1: Validar que id tiene valor
    if (!id || id < 1) {
      return {
        success: false,
        error:
          "Error eliminando formula en query en eliminarFormula de actions/formulas: No se obtuvo el id a eliminar",
      }
    }

    // Paso 2: Verificar que la formula existe
    const { data: formulaExiste } = await supabase.from("formulas").select("id").eq("id", id).single()

    if (!formulaExiste) {
      return { success: false, error: "La formula que intenta eliminar no existe" }
    }

    // Paso 3: Ejecutar Query DELETE
    const { error } = await supabase.from("formulas").delete().eq("id", id)
    // Return si hay error en query
    if (error) {
      console.error("Error eliminando formula en query en eliminarFormula de actions/formulas:", error)
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/formulas")

    // Paso 4: Return resultados
    return { success: true, data: { id, message: "Formula eliminada exitosamente" } }
  } catch (error) {
    console.error("Error en eliminarFormula de actions/formulas: " + error)
    // Return info
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion eliminarFormula de actions/formulas: " + error,
    }
  }
}

// Función: eliminarFormulaXFormula: Función para eliminar la relación entre formula secundaria y formula principal
export async function eliminarFormulaXFormula(SecundariaId: number, formulaid: number) {
  try {
    // Paso 1: Validar parámetros
    if (!SecundariaId || SecundariaId <= 0 || !formulaid || formulaid <= 0) {
      return {
        success: false,
        error:
          "No se recibieron los parametros necesarios para ejecutar la funcion, en eliminarFormulaXFormula de app/actions/formulas",
      }
    }

    // Paso 2: Ejecutar Query DELETE
    const { error } = await supabase
      .from("formulasxformula")
      .delete()
      .eq("secundariaid", SecundariaId)
      .eq("formulaid", formulaid)

    // Return si hay error en query
    if (error) {
      console.error(
        "Error eliminando relación formula x formula en eliminarFormulaXFormula de actions/formulas:",
        error,
      )
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/formulas")

    // Paso 3: Return resultados
    return { success: true }
  } catch (error) {
    console.error("Error en eliminarFormulaXFormula de actions/formulas: " + error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion eliminarFormulaXFormula de actions/formulas: " + error,
    }
  }
}

// Función: eliminarFormulaXProducto: Función para eliminar la relación entre formula y producto
export async function eliminarFormulaXProducto(formulaid: number, productoid: number) {
  try {
    // Paso 1: Validar parámetros
    if (!formulaid || formulaid <= 0 || !productoid || productoid <= 0) {
      return {
        success: false,
        error:
          "No se recibieron los parametros necesarios para ejecutar la funcion, en eliminarFormulaXProducto de app/actions/formulas",
      }
    }

    // Paso 2: Ejecutar Query DELETE
    const { error } = await supabase
      .from("formulasxproducto")
      .delete()
      .eq("formulaid", formulaid)
      .eq("productoid", productoid)

    // Return si hay error en query
    if (error) {
      console.error(
        "Error eliminando relación formula x producto en eliminarFormulaXProducto de actions/formulas:",
        error,
      )
      return { success: false, error: "Error en query: " + error.message }
    }

    revalidatePath("/productos")

    // Paso 3: Return resultados
    return { success: true }
  } catch (error) {
    console.error("Error en eliminarFormulaXProducto de actions/formulas: " + error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion eliminarFormulaXProducto de actions/formulas: " + error,
    }
  }
}

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoFormula: Función especial para cambiar columna activo, el valor debe ser boolean
export async function estatusActivoFormula(id: number, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from("formulas").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error(
        "Error actualizando estatus activo de la formula en estatusActivoFormula de app/actions/formulas:",
        error,
      )
      return false
    }

    revalidatePath("/formulas")
    return true
  } catch (error: any) {
    console.error("Error en estatusActivoFormula de app/actions/formulas: ", error)
    return false
  }
}

// Función: listaDesplegableFormulas: Función que se utiliza para los dropdownlist
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

// Función: recalcularFormula: Función para recalcular el costo total de una formula sumando materias primas y formulas
export async function recalcularFormula(formulaid: number) {
  try {
    // Paso 1: Validar parámetro
    if (!formulaid || formulaid <= 0) {
      return {
        success: false,
        error:
          "No se recibieron los parametros necesarios para ejecuta la funcion recalcularFormula de app/actions/formulas",
      }
    }

    // Paso 2: Obtener materias primas relacionadas a la formula
    const { data: materiasPrimas, error: errorMP } = await supabase
      .from("materiasprimasxformula")
      .select(
        `
        materiaprimaid,
        cantidad,
        materiasprima:materiaprimaid (
          costo,
          costoconfactorimportacion
        )
      `,
      )
      .eq("formulaid", formulaid)

    if (errorMP) {
      console.error("Error obteniendo materias primas en recalcularFormula:", errorMP)
      return { success: false, error: "Error obteniendo materias primas: " + errorMP.message }
    }

    // Paso 3: Recorrer materias primas y actualizar costoparcial
    if (materiasPrimas && materiasPrimas.length > 0) {
      for (const mp of materiasPrimas) {
        const cantidad = mp.cantidad || 0
        const costoconfactorimportacion = (mp.materiasprima as any)?.costoconfactorimportacion || 0
        const costoparcial = cantidad * costoconfactorimportacion

        // Actualizar costoparcial en materiasprimasxformula
        const { error: errorUpdateMP } = await supabase
          .from("materiasprimasxformula")
          .update({ costoparcial })
          .eq("formulaid", formulaid)
          .eq("materiaprimaid", mp.materiaprimaid)

        if (errorUpdateMP) {
          console.error("Error actualizando costoparcial de materia prima:", errorUpdateMP)
        }
      }
    }

    // Paso 4: Obtener suma de costos parciales de materias primas
    const { data: dataSumaMP, error: errorSumaMP } = await supabase
      .from("materiasprimasxformula")
      .select("costoparcial")
      .eq("formulaid", formulaid)

    if (errorSumaMP) {
      console.error("Error obteniendo suma de materias primas:", errorSumaMP)
      return { success: false, error: "Error obteniendo suma de materias primas: " + errorSumaMP.message }
    }

    const MPCostoParcial = dataSumaMP?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0

    // Paso 5: Obtener formulas relacionadas
    const { data: formulas, error: errorF } = await supabase
      .from("formulasxformula")
      .select(
        `
        secundariaid,
        cantidad,
        formulas:secundariaid (
          costo
        )
      `,
      )
      .eq("formulaid", formulaid)

    if (errorF) {
      console.error("Error obteniendo formulas en recalcularFormula:", errorF)
      return { success: false, error: "Error obteniendo formulas: " + errorF.message }
    }

    // Paso 6: Recorrer formulas y actualizar costoparcial
    if (formulas && formulas.length > 0) {
      for (const formula of formulas) {
        const cantidad = formula.cantidad || 0
        const costo = (formula.formulas as any)?.costo || 0
        const costoparcial = cantidad * costo

        // Actualizar costoparcial en formulasxformula
        const { error: errorUpdateF } = await supabase
          .from("formulasxformula")
          .update({ costoparcial })
          .eq("formulaid", formulaid)
          .eq("secundariaid", formula.secundariaid)

        if (errorUpdateF) {
          console.error("Error actualizando costoparcial de formula:", errorUpdateF)
        }
      }
    }

    // Paso 7: Obtener suma de costos parciales de formulas
    const { data: dataSumaF, error: errorSumaF } = await supabase
      .from("formulasxformula")
      .select("costoparcial")
      .eq("formulaid", formulaid)

    if (errorSumaF) {
      console.error("Error obteniendo suma de formulas:", errorSumaF)
      return { success: false, error: "Error obteniendo suma de formulas: " + errorSumaF.message }
    }

    const FCostoParcial = dataSumaF?.reduce((sum, item) => sum + (item.costoparcial || 0), 0) || 0

    // Paso 8: Sumar ambos costos parciales
    const SumaElaboracion = MPCostoParcial + FCostoParcial

    // Paso 9: Actualizar costo en tabla formulas
    const { error: errorUpdate } = await supabase
      .from("formulas")
      .update({ costo: SumaElaboracion })
      .eq("id", formulaid)

    if (errorUpdate) {
      console.error("Error actualizando costo de formula en recalcularFormula:", errorUpdate)
      return { success: false, error: "Error actualizando costo: " + errorUpdate.message }
    }

    revalidatePath("/formulas")

    // Paso 10: Return resultados
    return { success: true, error: null }
  } catch (error) {
    console.error("Error en recalcularFormula de actions/formulas: " + error)
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar funcion recalcularFormula de actions/formulas: " + error,
    }
  }
}

// Función: copiarComposicionFormula: Copia materias primas y fórmulas de una fórmula base a una nueva
export async function copiarComposicionFormula(newFormulaId: number, baseFormulaId: number) {
  try {
    if (!newFormulaId || !baseFormulaId) {
      return { success: false, error: "IDs de fórmula inválidos" }
    }

    // 1. Copiar Materias Primas
    const { data: mps, error: errorMPs } = await supabase
      .from("materiasprimasxformula")
      .select("materiaprimaid, cantidad, costoparcial")
      .eq("formulaid", baseFormulaId)

    if (errorMPs) {
      console.error("Error leyendo MPs base:", errorMPs)
      return { success: false, error: errorMPs.message }
    }

    if (mps && mps.length > 0) {
      const mpsToInsert = mps.map((mp) => ({
        formulaid: newFormulaId,
        materiaprimaid: mp.materiaprimaid,
        cantidad: mp.cantidad,
        costoparcial: mp.costoparcial,
        fechacreacion: new Date().toISOString().split("T")[0],
        activo: true,
      }))

      const { error: insertMPs } = await supabase.from("materiasprimasxformula").insert(mpsToInsert)
      if (insertMPs) {
        console.error("Error copiando MPs:", insertMPs)
        return { success: false, error: insertMPs.message }
      }
    }

    // 2. Copiar Fórmulas Anidadas
    const { data: formulas, error: errorFormulas } = await supabase
      .from("formulasxformula")
      .select("secundariaid, cantidad, costoparcial")
      .eq("formulaid", baseFormulaId)

    if (errorFormulas) {
      console.error("Error leyendo Fórmulas base:", errorFormulas)
      return { success: false, error: errorFormulas.message }
    }

    if (formulas && formulas.length > 0) {
      const formulasToInsert = formulas.map((f) => ({
        formulaid: newFormulaId,
        secundariaid: f.secundariaid,
        cantidad: f.cantidad,
        costoparcial: f.costoparcial,
        fechacreacion: new Date().toISOString().split("T")[0],
        activo: true,
      }))

      const { error: insertFormulas } = await supabase.from("formulasxformula").insert(formulasToInsert)
      if (insertFormulas) {
        console.error("Error copiando Fórmulas:", insertFormulas)
        return { success: false, error: insertFormulas.message }
      }
    }

    // 3. Recalcular la nueva fórmula para asegurar consistencia
    await recalcularFormula(newFormulaId)

    return { success: true }
  } catch (error) {
    console.error("Error en copiarComposicionFormula:", error)
    return { success: false, error: "Error interno al copiar composición" }
  }
}
