/* ==================================================
  * Objetos
    - oProducto
    - oProductoXCliente
  * CRUD:
    - Producto
    - ProductoCrear
    - ProductoActualizar
    - ProductoCaracteristicas
    - ProductoCaracteristicasCrear
    - ProductoCaracteristicasActualizar
    - ProductoXCliente
    - ProductoXClienteCrear
    - ProductoXClienteActualizar
    - ProductoXClientePronostico
    - ProductoXClientePronosticoCrear
    - ProductoXClientePronosticoActualizar
  * Especiales:
    - ProductosListado
    - ProductoXCatalogo
    - ProductosEstadisticas
================================================== */

// Objetos 
export interface oProducto {
  id: number
  producto: string | null
  presentacion: string | null
  nombre: string | null
  formafarmaceuticaid: number
  formasfarmaceuticas: {
    nombre: string | null
  }
  porcion: number | null
  sistemaid: number
  sistemas: {
    nombre: string | null
  }
  codigomaestro: string | null
  codigo: string | null
  envase: string | null
  envaseml: number | null
  clienteid: number | null
  clientes: {
    nombre: string | null
  }
  zonaid: number | null
  zonas: {
    nombre: string | null
  }
  categoria: string | null
  imgurl: string | null
  unidadmedidaid: number
  unidadesmedida: {
    descripcion: string | null
  }
  mp: number | null
  mem: number | null
  me: number | null
  ms: number | null
  mp_porcentaje: number | null
  mem_porcentaje: number | null
  me_porcentaje: number | null
  ms_porcentaje: number | null
  mp_costeado: number | null
  mem_costeado: number | null
  me_costeado: number | null
  ms_costeado: number | null
  costo: number | null
  preciohl: number | null
  utilidadhl: number | null
  forecasthl:number | null
  preciosinivaaa: number | null
  precioconivaaa: number | null
  fechacreacion: string | null
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
  materialesetiquetadoxproducto: Array<{
    materialetiquetadodid: numbre | null
    materialesetiquetado:{
      codigo: string | null
      nombre: string | null
      imgurl: string | null
      tipomaterialid: number | null
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
      formulasxformula: Array<{
        secundariaid: number | null
        cantidad: number | null
        costoparcial: number | null
        formulas:{
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
  /*
  productosxcatalogo: Array<{
    catalogoid: number | null
    precioventa: number | null
    margenutilidad: number | null
    catalogos: {
      nombre: string | null
      descripcion: string | null
    } | null
  }> | null
  */
}

export interface ProductoXCliente{
    idrec: number | null
    clienteid: number | null
    clientes: {
        nombre: string | null
    }
    productoid: number | null
    productos:{
        codigo: string | null
        nombre: string | null
        mp: number | null
        me: number | null
        ms: number | null
        costo: number | null
        mp_porcentaje: number | null
        me_porcentaje: number | null
        ms_porcentaje: number | null
        mp_costeado: number | null
        me_costeado: number | null
        ms_costeado: number | null
        preciohl: number | null
        utilidadhl: number | null
    }
    categoria: string | null
    precioventasiniva: number | null
    precioventaconiva: number | null
    preciohl: number | null
    
    plangeneracional: number | null
    plannivel: number | null
    planinfinito: number | null
    ivapagado: number | null
    cda: number | null
    bonoiniciorapido: number | null
    constructoriniciorapido: number | null
    rutaexito: number | null
    reembolsos: number | null
    tarjetacredito: number | null
    envio: number | null
    porcentajecosto: number | null
    totalcostos: number | null
    utilidadmarginal: number | null
    precioactualporcentajeutilidad: number | null
}

export interface ProductoXClienteN{
    plangeneracional: number | null
    plannivel: number | null
    planinfinito: number | null
    ivapagado: number | null
    cda: number | null
    bonoiniciorapido: number | null
    constructoriniciorapido: number | null
    rutaexito: number | null
    reembolsos: number | null
    tarjetacredito: number | null
    envio: number | null
    porcentajecosto: number | null
    totalcostos: number | null
    utilidadmarginal: number | null
    precioactualporcentajeutilidad: number | null
}

export interface ProductoXClienteOptimoN{
    utilidadoptima: number | null
    comisiones_porcentaje: number | null
    costo_porcentaje: number | null
    comisionesmascosto: number | null
    preciometa: number | null
    preciometaconiva: number | null
    diferenciautilidadesperada: number | null
}

export interface ProductoXClienteOptimo{
    idrec: number | null
    clienteid: number | null
    clientes: {
        nombre: string | null
    }
    productoid: number | null
    productos:{
        codigo: string | null
        nombre: string | null
        mp: number | null
        me: number | null
        ms: number | null
        costo: number | null
        mp_porcentaje: number | null
        me_porcentaje: number | null
        ms_porcentaje: number | null
        mp_costeado: number | null
        me_costeado: number | null
        ms_costeado: number | null
        preciohl: number | null
        utilidadhl: number | null
    }
    categoria: string | null
    precioventasiniva: number | null
    precioventaconiva: number | null
    preciohl: number | null
    utilidadoptima: number | null
    comisiones_porcentaje: number | null
    costo_porcentaje: number | null
    comisionesmascosto: number | null
    preciometa: number | null
    preciometaconiva: number | null
    diferenciautilidadesperada: number | null
}

export type ProductoXClienteOptimos = ProductoXClienteOptimo[]

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
  activo: boolean | null
}

export interface ProductoXCliente {
  idrec: number | null
  catalogoid: number | null
  productoid: number | null
  cantidad: number | null
  precioventa: number | null
  margenutilidad: number | null
  fechacreacion: Date | null
  activo: boolean | null
}
export interface ProductoXClienteCrear {
  catalogoid: number | null
  productoid: number | null
  cantidad: number | null
  precioventa: number | null
  margenutilidad: number | null
  fechacreacion: Date | null
}
export interface ProductoXClienteActualizar {
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
  ProductoCodigo: string
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
