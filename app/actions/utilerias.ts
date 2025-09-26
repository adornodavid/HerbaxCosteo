"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@/lib/supabase"
import { encryptData, decryptData } from "@/lib/encryption"
import bcrypt from "bcryptjs"

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
// Función: Encrypt - (Crypto-js)
export async function Encrypt(texto: string): Promise<string> {
  try {
    return encryptData(texto)
  } catch (error) {
    console.error("Error encrypting text:", error)
    throw new Error("Failed to encrypt text")
  }
}

// Función: Desencrypt - (Crypto-js)
export async function Desencrypt(textoEncriptado: string): Promise<string> {
  try {
    return decryptData(textoEncriptado)
  } catch (error) {
    console.error("Error decrypting text:", error)
    throw new Error("Failed to decrypt text")
  }
}

// Función: Hashear - (Bcrypt-js) : Hashear o encriptar texto, utilizado para contraseñas
export async function HashData(texto: string): Promise<string>{
  try {
    return bcrypt.hash(texto, 10)
  } catch (error) {
    console.error("Error hashing text:", error)
    throw new Error("Failed to hash text")
  }
}
