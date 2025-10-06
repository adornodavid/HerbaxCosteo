/* ==================================================
  Interfaces:
    * CRUD
      - Zona
      - ZonaCrear
      - ZonaActualizar
    * Especiales
================================================== */

// CRUD
export interface Zona {
  id: number
  nombre: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}



export interface ZonaCrear {
  nombre: string
}

export interface ZonaActualizar {
  id: number
  nombre?: string
  activo?: boolean
}

// Especiales
