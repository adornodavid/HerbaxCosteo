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
    - imagenValidaciones / imageValidations
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
export async function imagenSubir(imageFile: File, name: string, folder: string) {
  // Validar que se recibió archivo
  if (!imageFile || imageFile.size === 0) {
    return { success: false, error: "No se proporcionó una imagen válida" }
  }

  // Validar tipo de archivo
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!validTypes.includes(imageFile.type)) {
    return { success: false, error: "Tipo de archivo no válido" }
  }

  // Validar tamaño máximo (10MB)
  const MAX_SIZE = 10 * 1024 * 1024
  if (imageFile.size > MAX_SIZE) {
    return { success: false, error: "La imagen excede el tamaño máximo de 10MB" }
  }

  // Crear nombre con extensión
  const fileExtension = imageFile.name.split(".").pop()
  const fileName = `${name}-${Date.now()}.${fileExtension}`

  // Subir imagen a repositorio
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("healthylab")
    .upload(`${folder}/${fileName}`, imageFile)

  // Si se presentó un error
  if (uploadError) {
    console.error("Error subiendo imagen en actions/utilerias imagenSubir:", uploadError)
    return { success: false, error: "Error al subir la imagen" }
  }

  // Obtener URL
  const { data: urlData } = supabase.storage.from("healthylab").getPublicUrl(`${folder}/${fileName}`)

  // Retorno de resultado exitoso
  return { success: true, url: urlData.publicUrl }
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
export async function HashData(texto: string): Promise<string> {
  try {
    return bcrypt.hash(texto, 10)
  } catch (error) {
    console.error("Error hashing text:", error)
    throw new Error("Failed to hash text")
  }
}
