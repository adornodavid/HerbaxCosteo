/* ==================================================
  Interfaces:
    * CRUD
      - Usuario
      - UsuarioCrear
      - UsuarioActualizar
    * Especiales
================================================== */

// CRUD
export interface Usuario {
  id: number
  nombre: string
  email: string
  password?: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
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
