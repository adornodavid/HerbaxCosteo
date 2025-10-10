"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { PageLoadingScreen } from "@/components/page-loading-screen"

export default function Page() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect to clientes page if user is authenticated
        router.push("/clientes")
      } else {
        // Redirect to login if not authenticated
        router.push("/login")
      }
    }
  }, [isLoading, user, router])

  return <PageLoadingScreen />
}
