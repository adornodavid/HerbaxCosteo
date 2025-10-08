/* ==================================================
  * Objetos / Clases
    - oCliente
  * CRUD:
    - Cliente
    - ClienteCrear
    - ClienteActualizar
  * Especiales:
================================================== */

// Objetos / Clases
export interface oCliente {
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
export interface Cliente {
  id: number
  nombre: string
  clave: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  imgurl: string | null
  fechacreacion: Date | null
  activo: boolean | null
}

export interface ClienteCrear {
  nombre: string
  clave: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  imgurl: string | null
  fechacreacion: Date | null
}

export interface ClienteActualizar {
  id: number
  nombre: string
  clave: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  imgurl: string | null
  activo: boolean | null
}

// Especiales
