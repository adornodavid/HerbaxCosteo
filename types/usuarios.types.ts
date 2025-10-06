/* ==================================================
  * CRUD:
    - Usuario
    - UsuarioCrear
    - UsuarioActualizar
  * Especiales:
================================================== */

// CRUD
export interface Usuario {
  id: number | null
  nombrecompleto: string | null
  email: string | null
  password: string | null
  rolid: number  | null
  clienteid: number | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface UsuarioCrear {
  nombrecompleto: string | null
  email: string | null
  password: string | null
  rolid: number  | null
  clienteid: number | null
  fechacreacion: Date | null
}

export interface UsuarioActualizar {
  id: number | null
  nombrecompleto: string | null
  email: string | null
  password: string | null
  rolid: number  | null
  clienteid: number | null
  activo: boolean | null
}

export interface UsuarioLogin {
  email: string
  password: string
}

// Especiales
interface SessionData {
  UsuarioId: string | null
  Email: string | null
  NombreCompleto: string | null
  HotelId: string | null
  RolId: string | null
  Permisos: string[] | null
  SesionActiva: boolean | null
  ClienteId: string | null // Added ClienteId to SessionData
}
