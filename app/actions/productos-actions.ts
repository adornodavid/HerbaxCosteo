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
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarProducto / updProducto
  * DELETES-ELIMINAR (DELETES)
    - eliminarProducto / delProducto
  * SPECIALS-ESPECIALES ()
    - estatusActivoProducto / actProducto
    - listaDesplegableProductos / ddlProductos
================================================== */
//Función: crearProducto: función para crear un producto
export async function crearProducto(productoData: {
  nombre: string
  descripcion?: string | null
  instruccionespreparacion?: string | null
  tiempopreparacion?: string | null
  costototal?: number | null
  imgurl?: string | null
  activo?: boolean
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos") // Cambiado de 'platillos' a 'productos'
      .insert({
        ...productoData,
        fechacreacion: new Date().toISOString(),
        fechaactualizacion: new Date().toISOString(),
        activo: productoData.activo ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creando producto:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/productos") // Cambiado de '/platillos' a '/productos'
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
