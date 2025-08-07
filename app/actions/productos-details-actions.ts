"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function getProductoDetailsForModal(productoId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos") // Cambiado de 'platillos' a 'productos'
      .select(
        `
        id,
        nombre as Producto,
        descripcion,
        instruccionespreparacion,
        tiempopreparacion,
        imgurl,
        costototal as CostoTotal,
        productosxcatalogo (
          id,
          precioventa,
          margenutilidad,
          catalogos (
            id,
            nombre as Catalogo,
            clientes (
              id,
              nombre as Cliente
            )
          )
        )
      `,
      )
      .eq("id", productoId)

    if (error) {
      console.error("Error obteniendo detalles del producto para modal:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Producto no encontrado" }
    }

    // Transformar los datos para el formato deseado en el modal
    const transformedData = data.flatMap((producto: any) =>
      producto.productosxcatalogo.map((pxc: any) => ({
        id: producto.id,
        Producto: producto.Producto,
        descripcion: producto.descripcion,
        instruccionespreparacion: producto.instruccionespreparacion,
        tiempopreparacion: producto.tiempopreparacion,
        imgurl: producto.imgurl,
        CostoTotal: producto.CostoTotal,
        precioventa: pxc.precioventa,
        margenutilidad: pxc.margenutilidad,
        Cliente: pxc.catalogos.clientes.Cliente,
        Catalogo: pxc.catalogos.Catalogo,
        PrecioSugerido: producto.CostoTotal * 2, // Ejemplo de precio sugerido
      })),
    )

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error en getProductoDetailsForModal:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
