/* ==================================================
  Interfaces:
    - Producto
    - ProductoCaracteristicas
    - ProductosListado
    - ProductoXCatalogo
    - ProductosEstadisticas
================================================== */
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
