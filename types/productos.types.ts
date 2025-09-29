interface Producto {
  id: number
  codigo: string | null
  clienteid: number | null
  clientes: {
    nombre: string | null
  }
  zonaid: number | null
  zonas: {
    nombre: string | null
  }
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number
  unidadesmedida: {
    descripcion: string | null
  }
  costo: number | null
  activo: boolean | null
  productoscaracteristicas: {
    descripcion: string | null
    presentacion: string | null
    porcion: string | null
    modouso: string | null
    porcionenvase: string | null
    categoriauso: string | null
    propositoprincipal: string | null
    propuestavalor: string | null
    instruccionesingesta: string | null
    edadminima: number | null
    advertencia: string | null
    condicionesalmacenamiento: string | null
  }
  productosxcatalogo: Array<{
    catalogoid: number | null
    precioventa: number | null
    margenutilidad: number | null
    catalogos: {
      nombre: string | null
      descripcion: string | null
    } | null
  }> | null
  
}

interface ProductoCatalogo {
  catalogoid: number | null
  precioventa: number | null
  margenutilidad: number | null
  catalogos: {
    nombre: string | null
    descripcion: string | null
  }
}

interface ProductoListado {
  ProductoId: number
  ProductoNombre: string
  ProductoDescripcion: string
  ProductoTiempo: string
  ProductoCosto: number
  ProductoActivo: boolean
  ProductoImagenUrl: string | null
  ClienteId: number
  ClienteNombre: string
  CatalogoId: number
  CatalogoNombre: string
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

interface ProductosEstadisticas {
  totalProductos: number
  costoPromedio: number
  costoTotal: number // Cambiado de 'costo' a 'costoTotal' para mayor claridad
  tiempoPromedio: string
}
