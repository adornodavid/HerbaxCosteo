import { NextRequest } from "next/server"
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth"
import { createApiClient } from "@/lib/supabase-api"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  try {
    const { id } = await params
    const productoId = parseInt(id)
    if (isNaN(productoId)) return errorResponse("ID inválido", 400)

    const supabase = createApiClient()

    // Producto completo
    const { data: producto, error: prodError } = await supabase
      .from("productos")
      .select(`
        id, codigo, nombre, producto, presentacion, porcion,
        codigomaestro, envase, envaseml, categoria, imgurl,
        clienteid, clientes!clienteid(nombre),
        zonaid, zonas!zonaid(nombre),
        formafarmaceuticaid, formasfarmaceuticas!formafarmaceuticaid(nombre),
        sistemaid, sistemas!sistemaid(nombre),
        unidadmedidaid, unidadesmedida!unidadmedidaid(descripcion),
        mp, mem, me, ms, costo,
        mp_porcentaje, mem_porcentaje, me_porcentaje, ms_porcentaje,
        mp_costeado, mem_costeado, me_costeado, ms_costeado,
        preciohl, utilidadhl, forecasthl,
        preciosinivaaa, precioconivaaa,
        fechacreacion, activo,
        productoscaracteristicas!productoid(
          descripcion, presentacion, porcion, modouso, porcionenvase,
          categoriauso, propositoprincipal, propuestavalor,
          instruccionesingesta, edadminima, advertencia,
          condicionesalmacenamiento, vidaanaquelmeses
        )
      `)
      .eq("id", productoId)
      .single()

    if (prodError) {
      if (prodError.code === "PGRST116") return notFoundResponse("Producto")
      return errorResponse(prodError.message)
    }

    // Fórmulas asociadas (via formulasxproducto)
    const { data: formulas } = await supabase
      .from("formulasxproducto")
      .select(`
        formulaid,
        cantidad,
        costoparcial,
        formulas!formulaid(id, codigo, nombre, costo)
      `)
      .eq("productoid", productoId)

    // Materiales de etiquetado asociados
    const { data: materiales } = await supabase
      .from("materialesetiquetadoxproducto")
      .select(`
        materialetiquetadoid,
        cantidad,
        costoparcial,
        materialesetiquetado!materialetiquetadoid(id, codigo, nombre, costo)
      `)
      .eq("productoid", productoId)

    return successResponse({
      ...producto,
      formulas: formulas || [],
      materialesEtiquetado: materiales || [],
    })
  } catch (error) {
    return errorResponse("Error interno del servidor")
  }
}
