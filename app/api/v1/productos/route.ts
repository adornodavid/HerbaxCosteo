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
    const presentacion = searchParams.get("presentacion") || ""
    const clienteId = parseInt(searchParams.get("clienteId") || "-1")
    const zonaId = parseInt(searchParams.get("zonaId") || "-1")
    const activo = searchParams.get("activo") || ""

    const supabase = createApiClient()
    let query = supabase.from("productos").select(`
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
      fechacreacion, activo
    `, { count: "exact" })

    if (id > 0) query = query.eq("id", id)
    if (nombre) query = query.ilike("nombre", `%${nombre}%`)
    if (presentacion) query = query.ilike("presentacion", `%${presentacion}%`)
    if (clienteId > 0) query = query.eq("clienteid", clienteId)
    if (zonaId > 0) query = query.eq("zonaid", zonaId)
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
