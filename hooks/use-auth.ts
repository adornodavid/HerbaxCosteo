"use client"

import { useState, useEffect } from "react"

interface User {
  id: number
  email: string
  RolId: number
  [key: string]: any
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate auth check - replace with actual auth logic
    const checkAuth = async () => {
      try {
        // TODO: Replace with actual auth check
        // For now, just set loading to false
        setIsLoading(false)
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  return { user, isLoading }
}
