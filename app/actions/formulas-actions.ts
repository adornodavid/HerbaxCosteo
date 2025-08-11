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
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Funciones
  --------------------
	* CREATES-CREAR (INSERTS)
    - crearFormula / insFormula
  * READS-OBTENER (SELECTS)
    - obtenerFormulas / selFormulas
    - obtenerFormulasPorFiltros / selFormulasXFiltros
    - obtenerFormulaPorId / selFormulaXId
  * UPDATES-ACTUALIZAR (UPDATES)
    - actualizarFormula / updFormula
  * DELETES-ELIMINAR (DELETES)
    - eliminarFormula / delFormula
  * SPECIALS-ESPECIALES ()
    - estatusActivoFormula / actFormula
    - listaDesplegableFormulas / ddlFormulas
================================================== */
//Función: crearFormula: funcion para crear una formula


//Función: obtenerFormulas: funcion para obtener todas las formulas
 export async function obtenerFormulas(page = 1, limit = 20){

}

//Función: obtenerFormulasPorFiltros: funcion para obtener todss lss formulas por el filtrado
export async function obtenerFormulasPorFiltros(nombre = "", clienteNombre = "", actvio = true, page = 1, limit = 20){

}

//Función: obtenerFormulaPorId: funcion para obtener la formula por Id de la formula


//Función: actualizarFormula: funcion para actualizar la información de una formula por Id de la formula


//Función: eliminarFormula: funcion para eliminar la información de una formula por Id de la formula


// Función: estatusActivoFormula: función para cambiar el estatus de una formula por Id de la formula


//Función: listaDesplegableFormulas: funcion para obtener todas lss formulas para el input dropdownlist
