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
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Funciones
  --------------------
	* INSERTS
		- insXXXXX
	* SELECTS
		- selXXXXX
	* UPDATES
		- updXXXXX
	* DELETES
		- delXXXXX
	* SPECIALS
		- xxxXXXXX
================================================== */
