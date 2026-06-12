"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, LogIn, UserPlus } from "lucide-react"

interface AuthModalContextType {
  isOpen: boolean
  openAuthModal: (callback?: () => void) => void
  closeAuthModal: () => void
  isLoggedIn: boolean
  checkAuth: () => boolean
  requireAuth: (callback: () => void) => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider")
  }
  return context
}

interface AuthModalProviderProps {
  children: ReactNode
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const checkAuthStatus = () => {
      const savedUser = localStorage.getItem("user")
      setIsLoggedIn(!!savedUser)
    }
    
    checkAuthStatus()
    window.addEventListener("storage", checkAuthStatus)
    window.addEventListener("userLoggedIn", checkAuthStatus)
    window.addEventListener("userLoggedOut", checkAuthStatus)
    
    return () => {
      window.removeEventListener("storage", checkAuthStatus)
      window.removeEventListener("userLoggedIn", checkAuthStatus)
      window.removeEventListener("userLoggedOut", checkAuthStatus)
    }
  }, [])

  const checkAuth = () => {
    const savedUser = localStorage.getItem("user")
    return !!savedUser
  }

  const openAuthModal = (callback?: () => void) => {
    if (callback) {
      setPendingCallback(() => callback)
    }
    setIsOpen(true)
  }

  const closeAuthModal = () => {
    setIsOpen(false)
    setPendingCallback(null)
    setError("")
    setLoginForm({ email: "", password: "" })
    setRegisterForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    })
  }

  const requireAuth = (callback: () => void) => {
    if (checkAuth()) {
      callback()
    } else {
      openAuthModal(callback)
    }
  }

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
    window.dispatchEvent(new Event("userLoggedIn"))
    closeAuthModal()
    if (pendingCallback) {
      pendingCallback()
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const userData = {
      id: "1",
      firstName: "Jean",
      lastName: "Dupont",
      email: loginForm.email,
      phone: "+33 6 12 34 56 78",
      address: "15 Rue de la Paix, 75001 Paris",
      country: "france",
    }

    localStorage.setItem("user", JSON.stringify(userData))
    setIsSubmitting(false)
    handleLoginSuccess()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setIsSubmitting(false)
      return
    }

    if (registerForm.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      setIsSubmitting(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const userData = {
      id: Date.now().toString(),
      firstName: registerForm.firstName,
      lastName: registerForm.lastName,
      email: registerForm.email,
      phone: registerForm.phone,
      address: "",
      country: "france",
    }

    localStorage.setItem("user", JSON.stringify(userData))
    setIsSubmitting(false)
    handleLoginSuccess()
  }

  return (
    <AuthModalContext.Provider value={{ isOpen, openAuthModal, closeAuthModal, isLoggedIn, checkAuth, requireAuth }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeAuthModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connexion requise</DialogTitle>
            <DialogDescription>
              Connectez-vous ou créez un compte pour continuer
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-loginEmail">Email</Label>
                  <Input
                    id="modal-loginEmail"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-loginPassword">Mot de passe</Label>
                  <Input
                    id="modal-loginPassword"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Votre mot de passe"
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modal-regFirstName">Prénom</Label>
                    <Input
                      id="modal-regFirstName"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      placeholder="Prénom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-regLastName">Nom</Label>
                    <Input
                      id="modal-regLastName"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-regEmail">Email</Label>
                  <Input
                    id="modal-regEmail"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-regPhone">Téléphone</Label>
                  <Input
                    id="modal-regPhone"
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-regPassword">Mot de passe</Label>
                  <Input
                    id="modal-regPassword"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Minimum 6 caractères"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-regConfirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="modal-regConfirmPassword"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="Confirmez votre mot de passe"
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Créer mon compte
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  )
}
