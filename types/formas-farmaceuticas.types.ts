/* ==================================================
  * CRUD
    - FormaFarmaceutica
    - FormaFarmaceuticaCrear
    - FormaFarmaceuticaActualizar
================================================== */

// CRUD
export interface FormaFarmaceutica {
  id: number | null
  nombre: string | null
  descripcion: string | null
}

export interface FormaFarmaceuticaCrear {
  nombre: string | null
  descripcion: string | null
}

export interface FormaFarmaceuticaActualizar {
  id: number | null
  nombre: string | null
  descripcion: string | null
}

// Especiales
