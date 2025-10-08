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
    - objetoMaterialEtiquetado / oMaterialEtiquetado (Individual)
    - objetoMaterialesEtiquetados / oMaterialesEtiquetados (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearMaterialEtiquetado / insMaterialEtiquetado
  * READS-OBTENER (SELECTS)
    - obtenerMaterialesEtiquetados / selMaterialesEtiquetados
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarMaterialEtiquetado / updMaterialEtiquetado
  * DELETES-ELIMINAR (DELETES)
    - eliminarMaterialEtiquetado / delMaterialEtiquetado
  * SPECIALS-ESPECIALES ()
    - estatusActivoMaterialEtiquetado / actMaterialEtiquetado
    - listaDesplegableMaterialesEtiquetados / ddlMaterialesEtiquetados
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */

/*==================================================
    CREATES-CREAR (INSERTS)
================================================== */

/*==================================================
  READS-OBTENER (SELECTS)
================================================== */
// Función: obtenerMaterialesEtiquetados / selMaterialesEtiquetados: Función para obtener el o los materiales de etiquetado


/*==================================================
  UPDATES-ACTUALIZAR (UPDATES)
================================================== */

/*==================================================
  * DELETES-ELIMINAR (DELETES)
================================================== */


/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */
