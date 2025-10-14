export const AppConfig = {
  // Arrays de configuración
  arrays: {
    // Array de números
    categoriasPermitidas: [1, 2, 3, 5],
    
    // Array de strings
    estadosProducto: ['activo', 'inactivo', 'pendiente', 'descontinuado'],
    
    // Array de objetos
    rolesSistema: [
      { id: 1, nombre: 'Administrador', nivel: 10 },
      { id: 2, nombre: 'Supervisor', nivel: 5 },
      { id: 3, nombre: 'Usuario', nivel: 1 }
    ],
    
    // Array para dropdowns
    opcionesUnidadMedida: [
      { id: 1, valor: 'kg', label: 'Kilogramos' },
      { id: 2, valor: 'g', label: 'Gramos' },
      { id: 3, valor: 'lb', label: 'Libras' },
      { id: 4, valor: 'oz', label: 'Onzas' }
    ],
    
    // Array para filtros
    meses: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  },
  
  // Arrays individuales (si prefieres)
  categoriasIds: [1, 2, 3, 5],
  zonasPermitidas: [101, 102, 103, 105],
  tiposDocumento: ['DNI', 'RUC', 'PASAPORTE', 'CEDULA']
} as const

// Exportar arrays individualmente (opcional)
export const RolesAdmin = [1, 2, 3] as const
export const RolesAdminArkamia = [1, 2] as const
export const RolesAdminSistema = [1, 2] as const
export const RolesAdminDirector = [3] as const
export const RolesAdminGerente = [4] as const
export const RolesCoordinador = [5] as const
export const Estados = ['activo', 'inactivo', 'pendiente'] as const
export const arrActivoTrue = ["True", "true", "TRUE", "Activo", "activo", "ACTIVO"] as const
export const arrActivoFalse = ["False", "false", "FALSE", "Inactivo", "inactivo", "INACTIVO"] as const
