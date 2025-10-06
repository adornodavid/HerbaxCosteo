/* ==================================================
  Interfaces:
    - Producto
    - ProductoCaracteristicas
    - ProductosListado
    - ProductoXCatalogo
    - ProductosEstadisticas
================================================== */
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
  formulasxproducto: Array<{
    formulaid: number | null
    formulas:{
      codigo: string | null
      nombre: string | null
      unidadmedidaid: number | null
      unidadesmedida: {
        descripcion: string | null
      }
      costo: number | null
      materiasprimasxformula: Array<{
        materiaprimaid: number | null
        cantidad: number | null
        costoparcial: number | null
        materiasprima:{
          codigo: string | null
          nombre: string | null
          unidadmedidaid: number | null
          unidadesmedida: {
            descripcion: string | null
          }
          costo: number | null
        }
      }> | null
    }
  }> | null
}

interface ProductoCaracteristicas{
  id: number
  productoid: number
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

interface ProductosListado {
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

interface ProductosEstadisticas {
  totalProductos: number
  costoPromedio: number
  costoTotal: number // Cambiado de 'costo' a 'costoTotal' para mayor claridad
  tiempoPromedio: string
}

interface ProductoXCatalogo {
  catalogoid: number | null
  precioventa: number | null
  margenutilidad: number | null
  catalogos: {
    nombre: string | null
    descripcion: string | null
  }
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
