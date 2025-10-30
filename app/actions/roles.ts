"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from '@/lib/supabase'

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

/* ==================================================
	  --------------------
  Objetos / Clases
  --------------------
  * Objetos
    - objetoCatalogo / oCatalogo (Individual)
    - objetoCatalogos / oCatalogos (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearCatalogo / insCatalogo
  * SELECTS: READ/OBTENER/SELECT
    - obtenerCatalogo / selCatalogos
  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarCatalogo / updCatalogo
  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarCatalogo / delCatalogo
  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoCatalogo / actCatalogo
    - listaDesplegableCatalogos / ddlCatalogos
================================================== */
  
/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoCatalogo / oCatalogo (Individual): Esta Función crea de manera individual un objeto/clase


// Función: objetoCatalogos / oCatalogos (Listado): Esta Función crea un listado de objetos/clases, es un array


/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearCatalogo / insCatalogo: Función para insertar


/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerCatalogos / selCatalogos: Función para obtener 


/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarCatalogo / updCatalogo: Función para actualizar


/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarCatalogo / delCatalogo: Función para eliminar


/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoCatalogo / actCatalogo: Función especial para cambiar columna activo, el valor debe ser boolean


// Función: listaDesplegableCatalogos / ddlCatalogos: Función que se utiliza para los dropdownlist
