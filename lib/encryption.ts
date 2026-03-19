import CryptoJS from "crypto-js"

// Asegúrate de tener esta variable de entorno
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY is not defined in environment variables")
}

export function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

export function decryptData(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Para objetos JSON
export function encryptObject(obj: object): string {
  return encryptData(JSON.stringify(obj))
}

export function decryptObject<T>(encryptedData: string): T {
  const decrypted = decryptData(encryptedData)
  return JSON.parse(decrypted) as T
}
