"use client"

import { useEffect } from "react"
import { Header } from "@/components/library/header"
import { Footer } from "@/components/library/footer"
import { Toaster } from "@/components/ui/toaster"
import { AuthModalProvider } from "@/components/library/auth-modal"
import { useStore } from "@/lib/store"

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const loadApiData = useStore((state) => state.loadApiData)

  useEffect(() => {
    loadApiData()
  }, [loadApiData])

  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster />
      </div>
    </AuthModalProvider>
  )
}
