import { NextRequest } from "next/server"
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth"
import { createApiClient } from "@/lib/supabase-api"
import { successResponse, errorResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  try {
    const { searchParams } = request.nextUrl
    const id = parseInt(searchParams.get("id") || "-1")
    const clienteId = parseInt(searchParams.get("clienteId") || "-1")
    const zonaId = parseInt(searchParams.get("zonaId") || "-1")

    const supabase = createApiClient()
    let query = supabase.from("configuracionesxcliente").select("*").order("id", { ascending: true })

    if (id > 0) query = query.eq("id", id)
    if (clienteId > 0) query = query.eq("clienteid", clienteId)
    if (zonaId > 0) query = query.eq("zonaid", zonaId)

    const { data, error } = await query

    if (error) return errorResponse(error.message)

    return successResponse(data)
  } catch (error) {
    return errorResponse("Error interno del servidor")
  }
}
