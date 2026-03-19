"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

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
    - objetoUsuario / oUsuario (Individual)
    - objetoUsuarios / oUsuarios (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearUsuario / insUsuario

  * SELECTS: READ/OBTENER/SELECT
    - obtenerUsuarios / selUsuarios

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarUsuario / updUsuario

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarUsuario / delUsuario

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoUsuario / actUsuario
    - listaDesplegableUsuarios / ddlUsuarios
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoUsuario / oUsuario (Individual): Esta Función crea de manera individual un objeto/clase


// Función: objetoUsuarios / oUsuarios (Listado): Esta Función crea un listado de objetos/clases, es un array


/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearUsuario / insUsuario: Función para insertar


/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerUsuarios / selUsuarios: Función para obtener 


/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarUsuario / updUsuario: Función para actualizar


/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarUsuario / delUsuario: Función para eliminar


/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoUsuario / actUsuario: Función especial para cambiar columna activo, el valor debe ser boolean


// Función: listaDesplegableUsuarios / ddlUsuarios: Función que se utiliza para los dropdownlist

/*
export async function insUsuario(formData: FormData) {
  // Extraer los valores del FormData
  const nombrecompleto = formData.get("nombrecompleto") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const rolid = Number.parseInt(formData.get("rolid") as string)

  try {
    // Hashear la contraseña antes de insertarla
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .insert([
        {
          nombrecompleto: nombrecompleto,
          email: email,
          password: hashedPassword,
          rolid: rolid,
          activo: true,
        },
      ])
      .select()

    if (error) {
      console.error("Error inserting user:", error.message)
      return { success: false, message: `Error al insertar usuario: ${error.message}` }
    }

    revalidatePath("/pruebas/usuarios")
    return { success: true, message: "Usuario insertado exitosamente." }
  } catch (error: any) {
    console.error("Error en insUsuario:", error.message)
    return { success: false, message: `Error en el servidor: ${error.message}` }
  }
}
*/
