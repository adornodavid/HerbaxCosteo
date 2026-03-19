// Tipos para la vista vw_oproductos
// Basado en las columnas obtenidas de la consulta SELECT * FROM vw_oproductos

export interface oProductoAvanzado{
  clienteid: number | null
  cliente: string | null
  zonaid: number | null
  zona: string | null
  codigomaestro: string | null
  codigo: string | null
  codigointerno: string | null
  id: number | null
  productoprincipal: string | null
  envase: string | null
  cantidadpresentacion: string | null
  unidadpresentacion: string | null
  presentacion: string | null
  estatus: string | null
  nombre: string | null
  sistemaid: number | null
  objetivo: string | null
  subforma: string | null
  dosis: string | null
  porcion: string | null
  frecuencia: string | null
  envaseml: string | null
  imgurl: string | null
  costo: string | null
  mp: string | null
  mem: string | null
  me: string | null
  ms: string | null
  mp_porcentaje: string | null
  mem_porcentaje: string | null
  me_porcentaje: string | null
  ms_porcentaje: string | null
  mp_costeado: string | null
  mem_costeado: string | null
  me_costeado: string | null
  ms_costeado: string | null
  costototal: string | null
  preciohl: string | null
  utilidadhl: string | null
  forecasthl: string | null
  preciosinivaaa:string | null
  precioconivaaa: string | null
  tipocomisión: string | null
  formulas: Array<{
    id: number | null
    codigo: string | null
    nombre: string | null
    titulo: string | null
    detalle: string | null
    especificaciones: string | null
    medida: string | null
    tipomedida: string | null
    unidadmediaid: number | null
    unidadmedida: string| null
    costo: string | null
    fxpcantidad: string | null
    fxpcostoparcial: string | null 
    materias: Array<{
      id: number | null
      codigo: string | null
      nombre: string | null
      titulo: string | null
      detalle: string | null
      familia: string | null
      presentacion: string | null
      factorimportacion: string | null
      costoconfactorimportacion: string | null
      unidadmediaid: number | null
      unidadmedida: string| null
      costo: string | null
      mpxfcantidad: string | null
      mpxfcostoparcial: string | null 
    }  > | null  
  }> | null
  empaque: Array<{
    id: number | null
    codigo: string | null
    nombre: string | null
    titulo: string | null
    detalle: string | null
    especificaciones: string | null
    productodestino: string | null
    pais: string | null
    medida: string | null
    tipomedida: string | null
    color: string | null
    unidadmediaid: number | null
    unidadmedida: string| null
    costo: string | null
    memxpcantidad: string | null
    memxpcostoparcial: string | null
  }> | null
  envase: Array<{
    id: number | null
    codigo: string | null
    nombre: string | null
    titulo: string | null
    detalle: string | null
    especificaciones: string | null
    productodestino: string | null
    pais: string | null
    medida: string | null
    tipomedida: string | null
    color: string | null
    unidadmediaid: number | null
    unidadmedida: string| null
    costo: string | null
    mexpcantidad: string | null
    mexpcostoparcial: string | null
  }> | null
}

export interface oVistaProducto {
  
  id: number
  cliente: string | null
  clienteid: number | null
  zonaid: number | null
  zona: string | null
  codigomaestro: string | null
  codigo: string | null
  codigointerno: string | null
  productoprincipal: string | null
  producto: string | null
  envase: string | null
  cantidad: number | null
  unidadmedida: string | null
  presentacion: string | null
  sabor: string | null
  estado: boolean | null
  nombre: string | null
  sistemaid: number | null
  objetivo: string | null
  formafarmaceutica: string | null
  subforma: string | null
  dosis: string | null
  porcion: string | null
  frecuencia: string | null
  envaseml: number | null
  tipocomision: string | null
  imgurl: string | null
  costo: number | null
  preciohl: number | null
  utilidadhl: number | null
  forecasthl: number | null
  preciosinivaaa: number | null
  precioconivaaa: number | null
  fechacreacion: string | null
  formulaid: number | null
  formulanombre: string | null
  familia: string | null
  especificaciones: string | null
  formula: string | null
  medida: string | null
  tipomedida: string | null
}

// Tipos para la vista vw_oproductoscostos
// Basado en las columnas obtenidas de la consulta SELECT * FROM vw_oproductoscostos

export interface oProductoCosto {
  id: number
  cliente: string | null
  clienteid: number | null
  zonaid: number | null
  zona: string | null
  codigomaestro: string | null
  codigo: string | null
  codigointerno: string | null
  productoprincipal: string | null
  producto: string | null
  envase: string | null
  cantidad: number | null
  unidadmedida: string | null
  presentacion: string | null
  sabor: string | null
  estado: boolean | null
  nombre: string | null
  sistemaid: number | null
  objetivo: string | null
  formafarmaceutica: string | null
  subforma: string | null
  dosis: string | null
  porcion: string | null
  frecuencia: string
  envaseml: number | null
  tipocomision: string | null
  imgurl: string | null
  costo: number | null
  mp: number | null
  mem: number | null
  me: number | null
  ms: number | null
  mpporcentaje: number | null
  memporcentaje: number | null
  meporcentaje: number | null
  msporcentaje: number | null
  mpcosteado: number | null
  memcosteado: number | null
  mecosteado: number | null
  mscosteado: number | null
  costototal: number | null
  preciohl: number | null
  utilidadhl: number | null
  forecasthl: number | null
  preciosiniva: number | null
  precioconiva: number | null
  fechacreacion: string | null
  formulaid: number | null
  formulanombre: string | null
  familia: string | null
  especificaciones: string | null
  formula: string | null
  medida: string | null
  tipomedida: string | null
}

// Tipos para la vista vw_omaterialesxproducto
// Basado en las columnas obtenidas de la consulta SELECT * FROM vw_omaterialesxproducto

export interface oProductoMaterialesME {
  id: number
  cliente: string | null
  clienteid: number | null
  zonaid: number | null
  zona: string | null
  codigomaestro: string | null
  codigo: string | null
  codigointerno: string | null
  productoprincipal: string | null
  producto: string | null
  envase: string | null
  cantidad: number | null
  unidadmedida: string | null
  presentacion: string | null
  sabor: string | null
  estado: boolean | null
  nombre: string | null
  sistemaid: number | null
  objetivo: string | null
  formafarmaceutica: string | null
  subforma: string | null
  dosis: string | null
  porcion: string | null
  frecuencia: string | null
  envaseml: number | null
  tipocomision: string | null
  imgurl: string | null
  costo: number | null
  preciohl: number | null
  utilidadhl: number | null
  forecasthl: number | null
  preciosiniva: number | null
  precioconiva: number | null
  fechacreacion: string | null
  materialtipoid: number | null
  materialtipo: string | null
  materialid: number | null
  materialcodigo: string | null
  materialnombre: string | null
  materialfamilia: string | null
  materialdetalle: string | null
  materialespecificaciones: string | null
  materialproductodestino: string | null
  materialpais: string | null
  materialcolor: string | null
  materialunidadmedidaid: number | null
  materialunidadmedida: string | null
  materialimgurl: string | null
  materialcosto: number | null
  materialestado: boolean | null
  materialfechacreacion: string | null
  mxpidrec: number | null
  mxpcantidad: number | null
  mxpcostoparcial: number | null
  mxpfechacreacion: string | null
  mxpactivo: boolean | null
}

// Tipos para la vista vw_oformulasxproducto
// Basado en las columnas obtenidas de la consulta SELECT * FROM vw_oformulasxproducto

export interface oFormulaxProducto {
  id: number
  clienteid: number | null
  zonaid: number | null
  cliente: string | null
  zona: string | null
  codigomaestro: string | null
  codigo: string | null
  codigointerno: string | null
  productoprincipal: string | null
  producto: string | null
  envase: string | null
  cantidad: number | null
  unidadmedida: string | null
  presentacion: string | null
  sabor: string | null
  estado: boolean | null
  nombre: string | null
  sistemaid: number | null
  objetivo: string | null
  formafarmaceutica: string | null
  subforma: string | null
  dosis: string | null
  porcion: string | null
  frecuencia: string | null
  envaseml: number | null
  tipocomision: string | null
  imgurl: string | null
  costo: number | null
  preciohl: number | null
  utilidadhl: number | null
  forecasthl: number | null
  preciosinivaaa: number | null
  precioconivaaa: number | null
  fechacreacion: string | null
  formulaid: number | null
  formulacodigo: string | null
  formulanombre: string | null
  formulafamilia: string | null
  formulaespecificaciones: string | null
  formula: string | null
  formulamedida: string | null
  formulatipomedida: string | null
  formulaimgurl: string | null
  formulaunidadmedidaid: number | null
  formulaunidadmedida: string | null
  formulacosto: number | null
  formulaestado: boolean | null
  formulafechacreacion: string | null
  fxpidrec: number | null
  fxpcantidad: number | null
  fxpcostoparcial: number | null
  fxpfechacreacion: string | null
  fxpactivo: boolean | null
}

// Tipos para la vista vw_omaterialesenvasexproducto
// Basado en las columnas obtenidas de la consulta SELECT * FROM vw_omaterialesenvasexproducto

export interface oMaterialesEnvasexProducto {
  id: number
  clienteid: number | null
  zonaid: number | null
  cliente: string | null
  zona: string | null
  codigomaestro: string | null
  codigo: string | null
  codigointerno: string | null
  productoprincipal: string | null
  producto: string | null
  envase: string | null
  cantidad: number | null
  unidadmedida: string | null
  presentacion: string | null
  sabor: string | null
  estado: boolean | null
  nombre: string | null
  sistemaid: number | null
  objetivo: string | null
  formafarmaceutica: string | null
  subforma: string | null
  dosis: string | null
  porcion: string | null
  frecuencia: string | null
  envaseml: number | null
  tipocomision: string | null
  imgurl: string | null
  costo: number | null
  preciohl: number | null
  utilidadhl: number | null
  forecasthl: number | null
  preciosinivaaa: number | null
  precioconivaaa: number | null
  fechacreacion: string | null
  materialtipoid: number | null
  materialtipo: string | null
  materialcodigo: string | null
  materialnombre: string | null
  materialfamilia: string | null
  materialdetalle: string | null
  materialespecificaciones: string | null
  materialproductodestino: string | null
  materialpais: string | null
  medida: string | null
  tipomedida: string | null
  materialid: number | null
  materialcolor: string | null
  materialunidadmedidaid: number | null
  materialunidadmedida: string | null
  materialimgurl: string | null
  materialcosto: number | null
  materialestado: boolean | null
  materialfechacreacion: string | null
  mxpidrec: number | null
  mxpcantidad: number | null
  mxpcostoparcial: number | null
  mxpfechacreacion: string | null
  mxpactivo: boolean | null
}

// Tipos para la vista vw_omaterialesempaquexproducto
// Basado en las columnas obtenidas de la consulta SELECT * FROM vw_omaterialesempaquexproducto

export interface oMaterialesEmpaquexProducto {
  id: number
  clienteid: number | null
  zonaid: number | null
  cliente: string | null
  zona: string | null
  codigomaestro: string | null
  codigo: string | null
  codigointerno: string | null
  productoprincipal: string | null
  producto: string | null
  envase: string | null
  cantidad: number | null
  unidadmedida: string | null
  presentacion: string | null
  sabor: string | null
  estado: boolean | null
  nombre: string | null
  sistemaid: number | null
  objetivo: string | null
  formafarmaceutica: string | null
  subforma: string | null
  dosis: string | null
  porcion: string | null
  frecuencia: string | null
  envaseml: number | null
  tipocomision: string | null
  imgurl: string | null
  costo: number | null
  preciohl: number | null
  utilidadhl: number | null
  forecasthl: number | null
  preciosinivaaa: number | null
  precioconivaaa: number | null
  fechacreacion: string | null
  materialtipoid: number | null
  materialtipo: string | null
  materialid: number | null
  materialcodigo: string | null
  materialnombre: string | null
  materialfamilia: string | null
  materialdetalle: string | null
  materialespecificaciones: string | null
  materialproductodestino: string | null
  materialpais: string | null
  medida: string | null
  tipomedida: string | null
  materialcolor: string | null
  materialunidadmedidaid: number | null
  materialunidadmedida: string | null
  materialimgurl: string | null
  materialcosto: number | null
  materialestado: boolean | null
  materialfechacreacion: string | null
  mxpidrec: number | null
  mxpcantidad: number | null
  mxpcostoparcial: number | null
  mxpfechacreacion: string | null
  mxpactivo: boolean | null
}
