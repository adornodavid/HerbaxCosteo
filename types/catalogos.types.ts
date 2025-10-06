/* ==================================================
  Interfaces:
    * CRUD
      - Catalogo
      - CatalogoCrear
      - CatalogoActualizar
    * Especiales
================================================== */

// CRUD
export interface Catalogo {
  id: number
  nombre: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}

export interface CatalogoCrear {
  nombre: string
}

export interface CatalogoActualizar {
  id: number
  nombre?: string
  activo?: boolean
}

// Especiales
