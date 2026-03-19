import { NextRequest } from "next/server"
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth"
import { createApiClient } from "@/lib/supabase-api"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  try {
    const { id } = await params
    const clienteId = parseInt(id)
    if (isNaN(clienteId)) return errorResponse("ID inválido", 400)

    const supabase = createApiClient()

    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre, clave, direccion, telefono, email, imgurl, fechacreacion, activo")
      .eq("id", clienteId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return notFoundResponse("Cliente")
      return errorResponse(error.message)
    }

    return successResponse(data)
  } catch (error) {
    return errorResponse("Error interno del servidor")
  }
}
