"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { encryptData, decryptData } from "@/lib/encryption"

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

/* ==================================================
  Encryption Functions
================================================== */
// Función: Encrypt
export async function Encrypt(texto: string): Promise<string> {
  try {
    return encryptData(texto)
  } catch (error) {
    console.error("Error encrypting text:", error)
    throw new Error("Failed to encrypt text")
  }
}

// Función: Desencrypt
export async function Desencrypt(textoEncriptado: string): Promise<string> {
  try {
    return decryptData(textoEncriptado)
  } catch (error) {
    console.error("Error decrypting text:", error)
    throw new Error("Failed to decrypt text")
  }
}
