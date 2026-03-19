import { NextRequest } from "next/server"
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth"
import { createApiClient } from "@/lib/supabase-api"
import { parsePagination, successResponse, errorResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  try {
    const { searchParams } = request.nextUrl
    const { page, limit, offset } = parsePagination(searchParams)
    const id = parseInt(searchParams.get("id") || "-1")
    const nombre = searchParams.get("nombre") || ""
    const clienteId = parseInt(searchParams.get("clienteId") || "-1")
    const zonaId = parseInt(searchParams.get("zonaId") || "-1")

    const supabase = createApiClient()
    let query = supabase.from("vw_inventarios").select("*", { count: "exact" })

    if (id > 0) query = query.eq("id", id)
    if (nombre) query = query.ilike("nombre", `%${nombre}%`)
    if (clienteId > 0) query = query.eq("clienteid", clienteId)
    if (zonaId > 0) query = query.eq("zonaid", zonaId)

    query = query.order("nombre", { ascending: true }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) return errorResponse(error.message)

    return successResponse(data, { page, limit, total: count })
  } catch (error) {
    return errorResponse("Error interno del servidor")
  }
}
