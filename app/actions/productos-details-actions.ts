"use server"

import { createClient } from "@/lib/supabase-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
          instruccionespreparacion,
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
      instruccionespreparacion: item.productos.instruccionespreparacion,
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

export async function getProductoDetails(id: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from('Productos').select('*').eq('id', id).single();

  if (error) {
    console.error('Error al obtener detalles del producto:', error);
    return null;
  }
  return data;
}
