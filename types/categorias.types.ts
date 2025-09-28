export interface Categoria {
  id: number
  nombre: string
  activo: boolean
  fechacreacion?: Date
  fechamodificacion?: Date
}

export interface CategoriaCrear {
  nombre: string
}

export interface CategoriaActualizar {
  id: number
  nombre?: string
  activo?: boolean
}
