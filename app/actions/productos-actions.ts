"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarProducto / updProducto
  * DELETES-ELIMINAR (DELETES)
    - eliminarProducto / delProducto
  * SPECIALS-ESPECIALES ()
    - estatusActivoProducto / actProducto
    - listaDesplegableProductos / ddlProductos
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
      .from("productos") // Cambiado de 'platillos' a 'productos'
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

    revalidatePath("/productos") // Cambiado de '/platillos' a '/productos'
    revalidatePath(`/productos/${id}`) // Cambiado de '/platillos/${id}' a '/productos/${id}'
    return { success: true, data }
  } catch (error) {
    console.error("Error en actualizarProducto:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

//Función: obtenerProductos: función para obtener el listado de productos
export async function obtenerProductos() {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos") // Cambiado de 'platillos' a 'productos'
      .select("*")
      .eq("activo", true)
      .order("fechacreacion", { ascending: false })

    if (error) {
      console.error("Error obteniendo productos:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerProductos:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

//Función: obtenerProductoPorId: función para obtener un producto especifico por id
export async function obtenerProductoPorId(id: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos") // Cambiado de 'platillos' a 'productos'
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
      .select("id, nombre")
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
    const { data, error } = await supabaseAdmin
      .from("zonas")
      .select("id, nombre")
      .order("nombre", { ascending: true })

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
