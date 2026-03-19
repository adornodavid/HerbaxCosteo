import { NextRequest } from "next/server"
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth"
import { createApiClient } from "@/lib/supabase-api"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return unauthorizedResponse()

  try {
    const { id } = await params
    const formulaId = parseInt(id)
    if (isNaN(formulaId)) return errorResponse("ID inválido", 400)

    const supabase = createApiClient()

    const { data, error } = await supabase.from("formulas").select(`
      id,
      codigo,
      nombre,
      imgurl,
      unidadmedidaid,
      unidadesmedida!unidadmedidaid(descripcion),
      materiasprimasxformula!formulaid(
        materiaprimaid,
        materiasprima!materiaprimaid(
          codigo, nombre, imgurl, unidadmedidaid,
          unidadesmedida!unidadmedidaid(descripcion),
          costo, factorimportacion, costoconfactorimportacion
        ),
        cantidad,
        costoparcial
      ),
      formulasxformula!formulaid(
        secundariaid,
        formulas!secundariaid(
          codigo, nombre, imgurl, unidadmedidaid,
          unidadesmedida!unidadmedidaid(descripcion),
          costo
        ),
        cantidad,
        costoparcial
      ),
      costo,
      fechacreacion,
      activo
    `)
      .eq("id", formulaId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return notFoundResponse("Fórmula")
      return errorResponse(error.message)
    }

    return successResponse(data)
  } catch (error) {
    return errorResponse("Error interno del servidor")
  }
}
