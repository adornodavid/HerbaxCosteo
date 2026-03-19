import { NextRequest, NextResponse } from "next/server"

export function validateApiKey(request: NextRequest): { valid: boolean } {
  const apiKey = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("apiKey")
  const validKey = process.env.API_KEY

  if (!validKey) {
    console.error("API_KEY no configurada en variables de entorno")
    return { valid: false }
  }

  if (!apiKey || apiKey !== validKey) {
    return { valid: false }
  }

  return { valid: true }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: "No autorizado. API key inválida o no proporcionada." },
    { status: 401 }
  )
}
