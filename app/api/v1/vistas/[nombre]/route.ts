import { NextRequest } from "next/server"
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth"
import { createApiClient } from "@/lib/supabase-api"
import { parsePagination, successResponse, errorResponse } from "@/lib/api-utils"

const VISTAS_PERMITIDAS = [
  "vw_configuracionesfijo",
  "vw_cotizacioneseditar",
  "vw_inventarios",
  "vw_listadocotizaciones",
  "vw_oproductos",
  "vw_oreportelistadoavanzado",
  "vw_preciosproductos",
  "vw_productosvalororiginal",
]

export async function GET(request: NextRequest, { params }: { params: Promise<{ nombre: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  try {
    const { nombre } = await params

    if (!VISTAS_PERMITIDAS.includes(nombre)) {
      return errorResponse(
        `Vista no permitida. Vistas disponibles: ${VISTAS_PERMITIDAS.join(", ")}`,
        400
      )
    }

    const { searchParams } = request.nextUrl
    const { page, limit, offset } = parsePagination(searchParams)

    const supabase = createApiClient()
    const { data, error, count } = await supabase
      .from(nombre)
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)

    if (error) return errorResponse(error.message)

    return successResponse(data, { page, limit, total: count })
  } catch (error) {
    return errorResponse("Error interno del servidor")
  }
}
