import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types-sistema-costeo"

// Verify environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Define the database schema types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database }> =
  PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][Extract<
        keyof Database[PublicTableNameOrOptions["schema"]]["Tables"],
        string
      >]
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions]
      : never

export type TablesInsert<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database }> =
  PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][Extract<
        keyof Database[PublicTableNameOrOptions["schema"]]["Tables"],
        string
      >]["Insert"]
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions]["Insert"]
      : never

export type TablesUpdate<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database }> =
  PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][Extract<
        keyof Database[PublicTableNameOrOptions["schema"]]["Tables"],
        string
      >]["Update"]
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions]["Update"]
      : never

export type Enums<PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database }> =
  PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][Extract<
        keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"],
        string
      >]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
      ? PublicSchema["Enums"][PublicEnumNameOrOptions]
      : never

// Client-side client
export const createClient = () => createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client for Server Actions and Route Handlers
export const createServerClient = async () => {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Instancia principal de Supabase (para uso en cliente)
export const supabase = createClient()

// Exportación por defecto
export default supabase

// Additional type exports
export interface Platillo {
  id: number
  nombre: string
  descripcion?: string | null
  imagen_url?: string | null
  activo: boolean
  created_at: string
  updated_at?: string | null
}

export interface Hotel {
  id: number
  nombre: string
  direccion?: string | null
  email?: string | null
  telefono?: string | null
  activo: boolean
  created_at: string
  updated_at?: string | null
}

export interface Restaurante {
  id: number
  nombre: string
  direccion?: string | null
  email?: string | null
  telefono?: string | null
  hotel_id?: number | null
  imagen_url?: string | null
  activo: boolean
  created_at: string
  updated_at?: string | null
}

export interface PlatilloXMenu {
  id: number
  menu_id: number
  platillo_id: number
  created_at: string
  updated_at?: string | null
}
