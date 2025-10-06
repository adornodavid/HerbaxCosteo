/* ==================================================
  * CRUD:
    - MaterialEtiquetado
    - MaterialEtiquetadoCrear
    - MaterialEtiquetadoActualizar
  * Especiales:
================================================== */

// CRUD
export interface MaterialEtiquetado {
  id: number
  nombre: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}

export interface MaterialEtiquetadoCrear {
  nombre: string
}

export interface MaterialEtiquetadoActualizar {
  id: number
  nombre?: string
  activo?: boolean
}

// Especiales
