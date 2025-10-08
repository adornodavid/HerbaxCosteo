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
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - crearCliente / insCliente
  * READS-OBTENER (SELECTS)
    - obtenerClientes / selClientes
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarCliente / updCliente
  * DELETES-ELIMINAR (DELETES)
    - eliminarCliente / delCliente
  * SPECIALS-ESPECIALES ()
    - estatusActivoCliente / actCliente
    - listaDesplegableClientes / ddlClientes
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
