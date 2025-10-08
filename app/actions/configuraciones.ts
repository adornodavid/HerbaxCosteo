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
		* CREATES/CREAR/INSERTS
			- crearUsuario / insUsuario
		* READS/OBTENER/SELECTS
			- selXXXXX
		* UPDATES/ACTUALIZAR/UPDATES
			- updXXXXX
		* DELETES/ELIMINAR/DELETES
			- delXXXXX
		* SPECIALS/ESPECIALES
			- xxxXXXXX
	================================================== */
  
//  Función: insUsuario

export const RolesAdmin = [1, 2, 3, 4];
