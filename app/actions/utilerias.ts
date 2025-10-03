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
export async function imagenSubir(formData: FormData) {
  //Variables auxiliares
    let imgUrl = ""

    // Handle image upload if present
    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const fileName = `${Date.now()}-${imagen.name}`

      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("herbax")
        .upload(`productos/${fileName}`, imagen)

      if (uploadError) {
        console.error("Error uploading image:", uploadError)
        return { success: false, error: "Error al subir la imagen" }
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage.from("herbax").getPublicUrl(`productos/${fileName}`)

      imgUrl = urlData.publicUrl
    }
}

//Función: imagenBorrar / imageDelete: Eliminar una imagen de un repositorio/folder


//Función: imagenSustituir / imageRepalce: Sustituir una imagen de un repositorio/folder, mismo nombre


/* ==================================================
  Funciones: Textos
================================================== */
//Función: textoLimpiarParaProceder / textCleanToProcess: Quitar caracteres que pueden afectar proceso, evitar inyecciones SQL


//Función: textoEliminarCaracter / textDeleteChart: Quitar caracter de texto


//Función: textoSustituirCaracter / textoReplaceChart: Sustituir un caracter de texto


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
