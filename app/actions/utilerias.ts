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
  Funciones: Imagenes
  --------------------
  *
    - imagenSubir / imageUpload
    - imagenBorrar / imageDelete
    - imagenSustituir / imageReplace ?
    - imagenUrl / imageUrl ?

  --------------------
  Funciones: Textos
	--------------------
  *
    - textoLimpiarParaProceder / textCleanToProcess
    - textoEliminarCaracter / textDeleteChart
    - textoCambiarCaracter / textReplaceChart

  --------------------
  Funciones: Encryption
	--------------------
	* 
    - Encrypt - (Crypto-js)
    - Desencrypt - (Crypto-js)
    - HashData - (Bcrypt-js)
	================================================== */

/* ==================================================
  Funciones: Imagenes
================================================== */
//Función: imagenSubir / imageUpload: Subir una imagen a un repositorio/folder


//Función: imagenBorrar / imageDelete: Eliminar una imagen de un repositorio/folder


//Función: imagenSustituir / imageOverwrite: Sustituir una imagen de un repositorio/folder, mismo nombre


/* ==================================================
  Funciones: Textos
================================================== */
//Función: textoLimpiarParaProceder / textCleanToProcess: Quitar caracteres que pueden afectar proceso, evitar inyecciones SQL

/* ==================================================
  Funciones: Encryption
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
