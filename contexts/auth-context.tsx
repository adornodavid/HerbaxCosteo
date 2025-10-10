"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSession } from "@/app/actions/session-actions"
import { obtenerSesion } from "@/app/actions/session"
//import type { DatosSesion } from "@/lib/types-sistema-costeo"
import type { Session } from "@/types/usuarios"

interface AuthContextType {
  user: Session | null
  isLoading: boolean
  selectedHotel: number | null
  setSelectedHotel: (hotelId: number | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ["/login", "/logout"]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await obtenerSesion()

        if (session) {
          setUser(session)
          setSelectedHotel(session.ClienteId || null)
        } else if (!publicRoutes.includes(pathname)) {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        if (!publicRoutes.includes(pathname)) {
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  const logout = () => {
    setUser(null)
    setSelectedHotel(null)
    router.push("/logout")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        selectedHotel,
        setSelectedHotel,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
