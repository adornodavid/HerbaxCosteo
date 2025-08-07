import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/session' // Asume que getSession es una función para obtener la sesión

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que no requieren autenticación
  const publicRoutes = [
    '/login',
    '/logout',
    '/pruebas', // Añadido para permitir acceso sin sesión
    '/test',    // Añadido para permitir acceso sin sesión
    '/',        // La página de inicio también puede ser pública
  ]

  // Verificar si la ruta actual es una ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Si es una ruta pública, permite el acceso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Para todas las demás rutas, verifica la sesión
  const session = await getSession()

  // Si no hay sesión y no es una ruta pública, redirige al login
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay sesión, permite el acceso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth.js routes)
     * - public folder (e.g. /public/images)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|images|placeholder).*)',
  ],
}
