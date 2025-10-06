/* ==================================================
  Interfaces:
    * CRUD
      - FormaFarmaceutica
      - FormaFarmaceuticaCrear
      - FormaFarmaceuticaActualizar
================================================== */

// CRUD
export interface FormaFarmaceutica {
  id: number
  nombre: string
  descripcion: string
}

export interface FormaFarmaceuticaCrear {
  id: number
  nombre: string
  descripcion: string
}

export interface FormaFarmaceuticaActualizar {
  id: number
  nombre: string
  descripcion: string
}
