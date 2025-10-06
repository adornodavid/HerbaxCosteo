/* ==================================================
  * CRUD:
    - UnidadMedida
    - UnidadMedidaCrear
    - UnidadMedidaActualizar
  * Especiales:
================================================== */

// CRUD
export interface UnidadMedida {
  id: number | null
  descripcion: string | null
  calculoconversion: number | null
}

export interface UnidadMedidaCrear {
  descripcion: string | null
  calculoconversion: number | null
}

export interface UnidadMedidaActualizar {
  id: number | null
  descripcion: string | null
  calculoconversion: number | null
}

// Especiales
