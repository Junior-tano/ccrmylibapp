"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  User, Mail, Phone, MapPin, LogOut, ShoppingBag, BookOpen,
  History, Settings, Loader2, Package, Truck, PackageCheck, CheckCheck,
} from "lucide-react"
import { formatPriceFull } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  country: "france" | "benin"
}

interface OrderHistory {
  id: string
  date: string
  total: number
  status: "en_attente" | "paye" | "livre"
  items: { title: string; quantity: number }[]
  deliveryStep?: 1 | 2 | 3
  stepUpdatedAt?: {
    step1?: string
    step2?: string
    step3?: string
  }
}

interface EbookOrderHistory {
  id: string
  date: string
  total: number
  status: "en_attente" | "paye" | "livre"
  ebookTitle: string
  ebookAuthor: string
  email: string
  pdfUrl?: string
}

// Configuration des étapes de livraison
const DELIVERY_STEPS = [
  {
    step: 1 as const,
    label: "Commande en cours de préparation",
    description: "Votre commande a été reçue et est en cours de préparation par notre équipe.",
    icon: Package,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-600",
    dotColor: "bg-blue-600",
  },
  {
    step: 2 as const,
    label: "Commande en cours de livraison",
    description: "Votre colis a été remis au transporteur et est en route vers vous.",
    icon: Truck,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-500",
    dotColor: "bg-orange-500",
  },
  {
    step: 3 as const,
    label: "Commande livrée",
    description: "Votre colis a été livré avec succès. Merci pour votre commande !",
    icon: PackageCheck,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-600",
    dotColor: "bg-green-600",
  },
]

function CompteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab")
  const sectionParam = searchParams.get("section") as "profile" | "orders" | "ebooks" | null
  const [activeSection, setActiveSection] = useState<"profile" | "orders" | "ebooks">(
    sectionParam ?? "orders"
  )
  const storeOrders = useStore((state) => state.orders)
  const storeEbookOrders = useStore((state) => state.ebookOrders)
  const loadOrders = useStore((state) => state.loadOrders)
  const loadEbookOrders = useStore((state) => state.loadEbookOrders)
  
  const [user, setUser] = useState<UserData | null>(() => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem("user")
    return saved ? JSON.parse(saved) : null
  })
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("user")
  })
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    // Si on a déjà un user en localStorage, pas besoin d'afficher le loader
    return false
  })
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    tabParam === "register" ? "register" : "login"
  )
  const [orders, setOrders] = useState<OrderHistory[]>([])
  const [ebookOrders, setEbookOrders] = useState<EbookOrderHistory[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Update activeTab when URL param changes
  useEffect(() => {
    if (tabParam === "register") {
      setActiveTab("register")
    } else if (tabParam === "login") {
      setActiveTab("login")
    }
  }, [tabParam])

  useEffect(() => {
    // L'état user/isLoggedIn est déjà initialisé depuis localStorage via lazy useState
    // On marque juste le chargement comme terminé
    setIsLoading(false)
  }, [])

  // Charge les commandes depuis l'API dès que l'utilisateur est connecté
  useEffect(() => {
    if (!isLoggedIn || !user) return
    loadOrders()
    loadEbookOrders()

    // Rafraîchissement automatique toutes les 30s pour le suivi en temps réel
    const interval = setInterval(() => {
      loadOrders()
      loadEbookOrders()
    }, 30000)

    return () => clearInterval(interval)
  }, [isLoggedIn, user, loadOrders, loadEbookOrders])

  // Filtre les commandes du store par email OU userId de l'utilisateur connecté
  useEffect(() => {
    if (!isLoggedIn || !user) return

    const userOrders = storeOrders
      .filter((order) =>
        order.userEmail.toLowerCase() === user.email.toLowerCase() ||
        order.userId === user.id
      )
      .map((order) => ({
        id: order.id,
        date: order.createdAt,
        total: order.totalAmount + order.shippingFee,
        status: order.status,
        items: order.items.map((item) => ({ title: item.bookTitle, quantity: item.quantity })),
        deliveryStep: order.deliveryStep,
        stepUpdatedAt: order.stepUpdatedAt,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setOrders(userOrders)
  }, [isLoggedIn, storeOrders, user])

  // Filtre les commandes e-book du store par email OU userId
  useEffect(() => {
    if (!isLoggedIn || !user) return

    const userEbookOrders = storeEbookOrders
      .filter((order) =>
        order.userEmail.toLowerCase() === user.email.toLowerCase() ||
        order.userId === user.id
      )
      .map((order) => ({
        id: order.id,
        date: order.createdAt,
        total: order.totalAmount,
        status: order.status,
        ebookTitle: order.ebookTitle,
        ebookAuthor: order.ebookAuthor,
        email: order.userEmail,
        pdfUrl: order.pdfUrl,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setEbookOrders(userEbookOrders)
  }, [isLoggedIn, storeEbookOrders, user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    await new Promise((resolve) => setTimeout(resolve, 800))

    // Recherche de l'utilisateur dans localStorage (inscrit précédemment)
    const storedAccounts = localStorage.getItem("registeredAccounts")
    const accounts: Array<UserData & { password: string }> = storedAccounts ? JSON.parse(storedAccounts) : []

    const found = accounts.find(
      (acc) => acc.email.toLowerCase() === loginForm.email.toLowerCase() && acc.password === loginForm.password
    )

    if (!found) {
      setError("Email ou mot de passe incorrect")
      setIsSubmitting(false)
      return
    }

    const { password: _pwd, ...userData } = found

    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
    setIsLoggedIn(true)
    setIsSubmitting(false)
    window.dispatchEvent(new Event("userLoggedIn"))
  }

  const validatePassword = (pwd: string) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    const strength = validatePassword(registerForm.password)
    if (!strength.length || !strength.uppercase || !strength.lowercase || !strength.number || !strength.special) {
      setError("Le mot de passe ne respecte pas les règles de sécurité requises")
      setIsSubmitting(false)
      return
    }

    // Vérifier si l'email est déjà utilisé
    const storedAccounts = localStorage.getItem("registeredAccounts")
    const accounts: Array<UserData & { password: string }> = storedAccounts ? JSON.parse(storedAccounts) : []
    if (accounts.find((acc) => acc.email.toLowerCase() === registerForm.email.toLowerCase())) {
      setError("Un compte existe déjà avec cet email")
      setIsSubmitting(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 800))

    const userData: UserData = {
      id: Date.now().toString(),
      firstName: registerForm.firstName,
      lastName: registerForm.lastName,
      email: registerForm.email,
      phone: registerForm.phone,
      address: registerForm.address,
      country: "france",
    }

    // Sauvegarder le compte avec mot de passe dans la liste des comptes
    accounts.push({ ...userData, password: registerForm.password })
    localStorage.setItem("registeredAccounts", JSON.stringify(accounts))

    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
    setIsLoggedIn(true)
    setIsSubmitting(false)
    window.dispatchEvent(new Event("userLoggedIn"))
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    setUser(null)
    setIsLoggedIn(false)
    setOrders([])
    setEbookOrders([])
    // Dispatch event to notify header
    window.dispatchEvent(new Event("userLoggedOut"))
  }

  const getStatusBadge = (status: OrderHistory["status"], deliveryStep?: number) => {
    switch (status) {
      case "en_attente":
        return (
          <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            En attente
          </Badge>
        )
      case "paye":
        return (
          <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
            En cours
          </Badge>
        )
      case "livre":
        return (
          <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-50 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Livré
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    )
  }

  // ─── Vue connectée ───
  if (isLoggedIn && user) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold">Mon Compte</h1>
                <p className="text-muted-foreground">
                  Bienvenue, {user.firstName} {user.lastName}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>

            <Tabs value={activeSection} onValueChange={(v) => {
                const section = v as "profile" | "orders" | "ebooks"
                setActiveSection(section)
                router.replace(`/compte?section=${section}`, { scroll: false })
              }} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">Commandes</span>
                </TabsTrigger>
                <TabsTrigger value="ebooks" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">E-books</span>
                </TabsTrigger>
              </TabsList>

              {/* ─── ONGLET PROFIL ─── */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Mes informations
                    </CardTitle>
                    <CardDescription>Gérez vos informations personnelles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <User className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nom complet</p>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Mail className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Phone className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{user.phone || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <MapPin className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Adresse</p>
                          <p className="font-medium">{user.address || "Non renseignée"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── ONGLET COMMANDES ─── */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Mes commandes
                    </CardTitle>
                    <CardDescription>
                      Suivez l'avancement de vos commandes en temps réel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const isExpanded = expandedOrder === order.id
                          const currentStep = order.deliveryStep ?? 0

                          return (
                            <div
                              key={order.id}
                              className="border border-border rounded-xl overflow-hidden transition-all duration-200"
                            >
                              {/* En-tête de la commande */}
                              <div
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="font-semibold text-foreground">{order.id}</p>
                                    {getStatusBadge(order.status, currentStep)}
                                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                      Étape {currentStep}/3
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(order.date).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {order.items.map((item) => `${item.title} ×${item.quantity}`).join(", ")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="font-bold text-primary">{formatPriceFull(order.total).fcfa}</p>
                                    <p className="text-xs text-muted-foreground">{formatPriceFull(order.total).eur}</p>
                                  </div>
                                  {/* Mini indicateur de steps */}
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((s) => (
                                      <div
                                        key={s}
                                        className={cn(
                                          "w-2 h-2 rounded-full transition-all",
                                          currentStep >= s ? "bg-primary" : "bg-muted-foreground/20"
                                        )}
                                      />
                                    ))}
                                  </div>
                                  {/* Chevron */}
                                  <svg
                                    className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>

                              {/* ═══ BLOC SUIVI DE LIVRAISON (expandable) ═══ */}
                              {isExpanded && (
                                <div className="border-t border-border bg-muted/20 p-4">
                                  <div>
                                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/70 mb-4">
                                      Suivi de votre commande
                                    </p>

                                    <div className="relative">
                                      {DELIVERY_STEPS.map(({ step, label, description, icon: StepIcon, color, bg, border, iconBg }, index) => {
                                        const isValidated = currentStep >= step
                                        const isCurrent = currentStep === step - 1 && currentStep < 3
                                        const stepKey = `step${step}` as keyof NonNullable<typeof order.stepUpdatedAt>
                                        const stepDate = order.stepUpdatedAt?.[stepKey]

                                        return (
                                          <div key={step} className="relative flex gap-4 pb-5 last:pb-0">
                                            {index < DELIVERY_STEPS.length - 1 && (
                                              <div
                                                className={cn(
                                                  "absolute left-[15px] top-8 bottom-0 w-0.5 transition-colors duration-500",
                                                  currentStep > step ? "bg-primary/40" : "bg-border"
                                                )}
                                              />
                                            )}

                                            <div className="relative flex-shrink-0 z-10">
                                              <div
                                                className={cn(
                                                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
                                                  isValidated
                                                    ? `${iconBg} text-white ring-4 ring-offset-1 ring-primary/10`
                                                    : isCurrent
                                                      ? "bg-card border-2 border-primary text-primary shadow-sm"
                                                      : "bg-muted border-2 border-border text-muted-foreground"
                                                )}
                                              >
                                                {isValidated ? (
                                                  <CheckCheck className="h-3.5 w-3.5" />
                                                ) : (
                                                  <StepIcon className="h-3.5 w-3.5" />
                                                )}
                                              </div>
                                            </div>

                                            <div
                                              className={cn(
                                                "flex-1 rounded-xl p-3.5 border transition-all duration-300",
                                                isValidated
                                                  ? `${bg} ${border}`
                                                  : isCurrent
                                                    ? "bg-card border-primary/30"
                                                    : "bg-muted/10 border-border/30 opacity-60"
                                              )}
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                <div>
                                                  <p className={cn(
                                                    "text-[13px] font-semibold leading-tight",
                                                    isValidated ? color : isCurrent ? "text-foreground" : "text-muted-foreground"
                                                  )}>
                                                    {label}
                                                  </p>
                                                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                                    {description}
                                                  </p>
                                                  {isValidated && stepDate && (
                                                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                                      ✓ {new Date(stepDate).toLocaleDateString("fr-FR", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                      })}
                                                    </p>
                                                  )}
                                                </div>
                                                {isValidated ? (
                                                  <span className={cn(
                                                    "flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                                                    bg, border, color
                                                  )}>
                                                    Validé
                                                  </span>
                                                ) : isCurrent ? (
                                                  <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse">
                                                    En attente
                                                  </span>
                                                ) : null}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-border/50">
                                      <div className="flex items-center justify-between text-[11px] mb-2">
                                        <span className="text-muted-foreground font-medium">Progression de livraison</span>
                                        <span className={cn(
                                          "font-semibold",
                                          currentStep === 3 ? "text-green-600" : "text-primary"
                                        )}>
                                          {currentStep === 3 ? "✓ Livraison complète" : `${Math.round((currentStep / 3) * 100)}%`}
                                        </span>
                                      </div>
                                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full rounded-full transition-all duration-700",
                                            currentStep === 3 ? "bg-green-500" : "bg-primary"
                                          )}
                                          style={{ width: `${(currentStep / 3) * 100}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between mt-1">
                                        {["Préparation", "Livraison", "Livré"].map((label, i) => (
                                          <span
                                            key={i}
                                            className={cn(
                                              "text-[9px] font-medium transition-colors",
                                              currentStep > i ? "text-primary" : "text-muted-foreground/40"
                                            )}
                                          >
                                            {label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucune commande pour le moment</p>
                        <Button className="mt-4" asChild>
                          <Link href="/livres">Voir les livres</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── ONGLET E-BOOKS ─── */}
              <TabsContent value="ebooks">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Mes e-books
                    </CardTitle>
                    <CardDescription>Historique de vos e-books achetés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ebookOrders.length > 0 ? (
                      <div className="space-y-4">
                        {ebookOrders.map((order) => (
                          <div
                            key={order.id}
                            className="border border-border rounded-xl overflow-hidden"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-semibold text-foreground">{order.id}</p>
                                  {order.status === "en_attente" && (
                                    <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 font-medium text-[11px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                      En attente de validation
                                    </Badge>
                                  )}
                                  {order.status === "paye" && (
                                    <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 font-medium text-[11px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                                      Paiement validé
                                    </Badge>
                                  )}
                                  {order.status === "livre" && (
                                    <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-50 font-medium text-[11px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                      Disponible
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.date).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                  <div>
                                    <p className="font-medium text-sm">{order.ebookTitle}</p>
                                    <p className="text-xs text-muted-foreground">{order.ebookAuthor}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="text-right">
                                  <p className="font-bold text-primary">{formatPriceFull(order.total).fcfa}</p>
                                  <p className="text-xs text-muted-foreground">{formatPriceFull(order.total).eur}</p>
                                </div>
                                {(order.status === "livre" || order.status === "paye") && order.pdfUrl && (
                                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                                    <a href={order.pdfUrl} download>
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Télécharger
                                    </a>
                                  </Button>
                                )}
                                {order.status === "paye" && !order.pdfUrl && (
                                  <p className="text-xs text-muted-foreground">
                                    L&apos;e-book sera disponible sous 24-48h
                                  </p>
                                )}
                                {order.status === "en_attente" && (
                                  <p className="text-xs text-muted-foreground">
                                    En attente de validation du paiement
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun e-book acheté</p>
                        <Button className="mt-4" asChild>
                          <Link href="/ebooks">Voir les e-books</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    )
  }

  // ─── Vue non connectée (Login/Register) ───
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Mon Compte</CardTitle>
              <CardDescription>Connectez-vous ou créez un compte</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Connexion</TabsTrigger>
                  <TabsTrigger value="register">Inscription</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loginEmail">Email</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loginPassword">Mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="loginPassword"
                          type={showLoginPassword ? "text" : "password"}
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          placeholder="Votre mot de passe"
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showLoginPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
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
                        "Se connecter"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="regFirstName">Prénom</Label>
                        <Input
                          id="regFirstName"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                          placeholder="Prénom"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regLastName">Nom</Label>
                        <Input
                          id="regLastName"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                          placeholder="Nom"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regEmail">Email</Label>
                      <Input
                        id="regEmail"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regPhone">Téléphone</Label>
                      <PhoneInput
                        id="regPhone"
                        value={registerForm.phone}
                        onChange={(val) => setRegisterForm({ ...registerForm, phone: val })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regAddress">Adresse</Label>
                      <Input
                        id="regAddress"
                        value={registerForm.address}
                        onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                        placeholder="Votre adresse complète"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="regPassword"
                          type={showPassword ? "text" : "password"}
                          value={registerForm.password}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, password: e.target.value })
                            setPasswordStrength(validatePassword(e.target.value))
                          }}
                          placeholder="Minimum 8 caractères"
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {registerForm.password.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="font-medium text-muted-foreground mb-1">Règles du mot de passe :</p>
                          {[
                            { key: "length", label: "Minimum 8 caractères" },
                            { key: "uppercase", label: "Au moins une lettre majuscule" },
                            { key: "lowercase", label: "Au moins une lettre minuscule" },
                            { key: "number", label: "Au moins un chiffre" },
                            { key: "special", label: "Au moins un caractère spécial (!@#$...)" },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-1.5">
                              <span className={passwordStrength[key as keyof typeof passwordStrength] ? "text-green-600" : "text-muted-foreground/50"}>
                                {passwordStrength[key as keyof typeof passwordStrength] ? "✓" : "○"}
                              </span>
                              <span className={passwordStrength[key as keyof typeof passwordStrength] ? "text-green-600" : "text-muted-foreground/60"}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
                        "Créer mon compte"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-xs text-muted-foreground text-center">
                En vous inscrivant, vous acceptez nos conditions générales
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ComptePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    }>
      <CompteContent />
    </Suspense>
  )
}