import { NextRequest } from "next/server"
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth"
import { createApiClient } from "@/lib/supabase-api"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  try {
    const { id } = await params
    const cotizacionId = parseInt(id)
    if (isNaN(cotizacionId)) return errorResponse("ID inválido", 400)

    const supabase = createApiClient()

    const { data, error } = await supabase
      .from("vw_cotizacioneseditar")
      .select("*")
      .eq("id", cotizacionId)

    if (error) return errorResponse(error.message)
    if (!data || data.length === 0) return notFoundResponse("Cotización")

    return successResponse(data)
  } catch (error) {
    return errorResponse("Error interno del servidor")
  }
}
