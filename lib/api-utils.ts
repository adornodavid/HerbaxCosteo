import { NextResponse } from "next/server"

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

export function successResponse(data: any, meta?: { page: number; limit: number; total: number | null }) {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta: { ...meta, totalPages: meta.total ? Math.ceil(meta.total / meta.limit) : null } }),
  })
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function notFoundResponse(entity = "Registro") {
  return NextResponse.json({ success: false, error: `${entity} no encontrado` }, { status: 404 })
}
