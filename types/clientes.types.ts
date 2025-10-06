/* ==================================================
  Interfaces:
    - Cliente
    - ClienteCrear
    - ClienteActualizar
================================================== */
export interface Cliente {
  id: number
  nombre: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}

export interface ClienteCrear {
  nombre: string
}

export interface ClienteActualizar {
  id: number
  nombre?: string
  activo?: boolean
}
