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
    const codigo = searchParams.get("codigo") || ""
    const nombre = searchParams.get("nombre") || ""
    const activo = searchParams.get("activo") || ""

    const supabase = createApiClient()
    let query = supabase.from("materialesetiquetado").select(`
      id, codigo, nombre, imgurl, unidadmedidaid,
      unidadesmedida!unidadmedidaid(descripcion),
      costo, fechacreacion, activo, tipomaterialid
    `, { count: "exact" })

    if (id > 0) query = query.eq("id", id)
    if (codigo) query = query.ilike("codigo", `%${codigo}%`)
    if (nombre) query = query.ilike("nombre", `%${nombre}%`)
    if (activo === "true") query = query.eq("activo", true)
    else if (activo === "false") query = query.eq("activo", false)

    query = query.order("nombre", { ascending: true }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) return errorResponse(error.message)

    return successResponse(data, { page, limit, total: count })
  } catch (error) {
    return errorResponse("Error interno del servidor")
  }
}
