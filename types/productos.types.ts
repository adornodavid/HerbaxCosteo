export interface Producto {
  ProductoId: number
  ProductoCodigo: string
  ClienteId: number
  ZonaId: number
  ProductoNombre: string
  ProductoImgUrl?: string
  UnidadMedidaId: number
  ProductoCosto: number
  ProductoActivo: boolean
  FechaCreacion?: Date
  FechaModificacion?: Date
}

export interface ProductoListado {
  ProductoId: number
  ProductoNombre: string
  ProductoDescripcion?: string
  ProductoCosto: number
  ProductoActivo: string
  ProductoImgUrl?: string
}

export interface ProductoCaracteristicas {
  id: number
  productoid: number
  descripcion?: string
  presentacion?: string
  porcion?: string
  modouso?: string
  porcionenvase?: string
  categoriauso?: string
  propositoprincipal?: string
  propuestavalor?: string
  instruccionesingesta?: string
  edadminima?: number
  advertencia?: string
  condicionesalmacenamiento?: string
}

export interface ProductoCrear {
  ProductoCodigo: string
  ClienteId: number
  ZonaId: number
  ProductoNombre: string
  ProductoImgUrl?: string
  UnidadMedidaId: number
  ProductoCosto: number
}
