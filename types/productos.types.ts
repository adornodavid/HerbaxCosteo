/* ==================================================
  * Objetos / Clases
    - oProducto
  * CRUD:
    - Producto
    - ProductoCrear
    - ProductoActualizar
    - ProductoCaracteristicas
    - ProductoCaracteristicasCrear
    - ProductoCaracteristicasActualizar
    - ProductoXCatalogo
    - ProductoXCatalogoCrear
    - ProductoXCatalogoActualizar
  * Especiales:
    - ProductosListado
    - ProductoXCatalogo
    - ProductosEstadisticas
================================================== */

// Objetos / Clases
export interface oProducto {
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
  materialesetiquetadoxproducto: Array<{
    materialetiquetadodid: numbre | null
    materialesetiquetado:{
      codigo: string | null
      nombre: string | null
      imgurl: string | null
      unidadmedidaid: number | null
      unidadesmedida:{
        descripcion: string | null
      }
      costo: number | null
    }
    cantidad: number | null
    costoparcial: number | null
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

// CRUD
export interface Producto{
  id: number | null
  codigo: string | null
  clienteid: number | null
  zonaid: number | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: date | null
  activo: boolean | null
}
export interface ProductoCrear{
  codigo: string | null
  clienteid: number | null
  zonaid: number | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  fechacreacion: date | null
}
export interface ProductoActualizar{
  id: number | null
  codigo: string | null
  clienteid: number | null
  zonaid: number | null
  nombre: string | null
  imgurl: string | null
  unidadmedidaid: number | null
  costo: number | null
  activo: boolean | null
}

export interface ProductoCaracteristicas{
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
  fechacreacion: Date | null
  activo: boolean | null
}
export interface ProductoCaracteristicasCrear{
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
  fechacreacion: Date | null
  activo: boolean | null
}
export interface ProductoCaracteristicasActualizar{
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
  fechacreacion: Date | null
  activo: boolean | null
}

export interface ProductoXCatalogo {
  idrec: number | null
  catalogoid: number | null
  productoid: number | null
  cantidad: number | null
  precioventa: number | null
  margenutilidad: number | null
  fechacreacion: Date | null
  activo: boolean | null
}
export interface ProductoXCatalogoCrear {
  catalogoid: number | null
  productoid: number | null
  cantidad: number | null
  precioventa: number | null
  margenutilidad: number | null
  fechacreacion: Date | null
}
export interface ProductoXCatalogoActualizar {
  catalogoid: number | null
  productoid: number | null
  cantidad: number | null
  precioventa: number | null
  margenutilidad: number | null
  activo: boolean | null
}

// Especiales
export interface ProductosListado {
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

export interface ProductosEstadisticas {
  totalProductos: number
  costoPromedio: number
  costoTotal: number // Cambiado de 'costo' a 'costoTotal' para mayor claridad
  tiempoPromedio: string
}
