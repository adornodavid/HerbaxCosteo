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
  nombre: string
  email: string
  password: string
}

export interface UsuarioActualizar {
  id: number
  nombre?: string
  email?: string
  activo?: boolean
}

export interface UsuarioLogin {
  email: string
  password: string
}

// Especiales
