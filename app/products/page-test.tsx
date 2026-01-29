"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function ProductosPageTest() {
  const { user, isLoading } = useAuth()
  const [test, setTest] = useState("hello")
  
  if (isLoading) return <div>Loading...</div>
  
  return <div>Test Page: {test}</div>
}
