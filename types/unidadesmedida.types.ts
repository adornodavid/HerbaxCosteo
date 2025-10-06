/* ==================================================
  Interfaces:
    * CRUD
      - UnidadMedida
      - UnidadMedidaCrear
      - UnidadMedidaActualizar
    * Especiales
================================================== */

// CRUD
export interface UnidadMedida {
  id: number
  descripcion: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}

export interface UnidadMedidaCrear {
  descripcion: string
}

export interface UnidadMedidaActualizar {
  id: number
  descripcion?: string
  activo?: boolean
}
