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
    - objetoMateriaPrima / oMateriaPrima (Individual)
    - objetoMateriasPrimas / oMateriasPrimas (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearMateriaPrima / insMateriaPrima
  * READS-OBTENER (SELECTS)
    - obtenerMateriasPrimas / selMateriasPrimas
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarMateriaPrima / updMateriaPrima
  * DELETES-ELIMINAR (DELETES)
    - eliminarMateriaPrima / delMateriaPrima
  * SPECIALS-ESPECIALES ()
    - estatusActivoMateriaPrima / actMateriaPrima
    - listaDesplegableMateriasPrimas / ddlMateriasPrimas
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

/*==================================================
  UPDATES-ACTUALIZAR (UPDATES)
================================================== */

/*==================================================
  * DELETES-ELIMINAR (DELETES)
================================================== */


/*==================================================
  * SPECIALS-ESPECIALES ()
================================================== */
