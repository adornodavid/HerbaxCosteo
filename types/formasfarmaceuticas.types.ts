/* ==================================================
  Interfaces:
    - FormaFarmaceutica
    - FormaFarmaceuticaCrear
    - FormaFarmaceuticaActualizar
================================================== */
export interface FormaFarmaceutica {
  id: number
  nombre: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}



export interface FormaFarmaceuticaCrear {
  nombre: string
}

export interface FormaFarmaceuticaActualizar {
  id: number
  nombre?: string
  activo?: boolean
}
