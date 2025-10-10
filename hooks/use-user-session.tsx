"use client"

import { useEffect, useState } from "react"
import { obtenerSesion } from "@/app/actions/session"
import type { SessionData } from "@/app/actions/session"

export function useUserSession() {
  const [user, setUser] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await obtenerSesion()
        setUser(session)
      } catch (error) {
        console.error("Error obteniendo sesión:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  return { user, loading, profile: user }
}
