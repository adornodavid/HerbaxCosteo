/* ==================================================
  * CRUD:
    - MateriaPrima
    - MateriaPrimaCrear
    - MateriaPrimaActualizar
  * Especiales:
================================================== */

// CRUD
export interface MateriaPrima {
  id: number
  nombre: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}

export interface MateriaPrimaCrear {
  nombre: string
}

export interface MateriaPrimaActualizar {
  id: number
  nombre?: string
  activo?: boolean
}

// Especiales
