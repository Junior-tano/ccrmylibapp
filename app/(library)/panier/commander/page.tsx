"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { ArrowLeft, Book, Truck, CreditCard, User, MapPin, Mail, ShoppingCart } from "lucide-react"
import { formatPrice, formatShipping, formatTotal, eurToFcfa } from "@/lib/currency"

interface CartCheckoutData {
  items: {
    bookId: string
    bookTitle: string
    price: number
    quantity: number
  }[]
  subtotal: number
  shipping: number
  total: number
  country: "france" | "benin"
}

export default function CommanderPanierPage() {
  const router = useRouter()
  const { shippingFees, addOrder, shippingDelays } = useStore()
  const [cartData, setCartData] = useState<CartCheckoutData | null>(null)
  const [country, setCountry] = useState<"france" | "benin" | "cote_ivoire">("cote_ivoire")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    setMounted(true)
    const savedCart = localStorage.getItem("cartCheckout")
    if (savedCart) {
      const data = JSON.parse(savedCart)
      setCartData(data)
      setCountry(data.country)
    }
    // Pré-remplissage depuis le compte connecté
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      const u = JSON.parse(savedUser)
      setFormData({
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        address: u.address ?? "",
      })
    }
  }, [])

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-muted rounded w-64 mx-auto" />
        </div>
      </div>
    )
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Panier vide</h1>
        <p className="text-muted-foreground mb-6">
          Votre panier est vide ou la session a expire.
        </p>
        <Button asChild>
          <Link href="/livres">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voir les livres
          </Link>
        </Button>
      </div>
    )
  }

  const subtotal = cartData.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = shippingFees[country] ?? shippingFees["benin"] ?? 0
  // total toujours en FCFA pour cohérence du stockage
  const shippingFcfa = country === "france" ? eurToFcfa(shipping) : shipping
  const total = subtotal + shippingFcfa

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const savedUser = localStorage.getItem("user")
    const currentUser = savedUser ? JSON.parse(savedUser) : null

    const orderId = await addOrder({
      userId: currentUser?.id ?? Date.now().toString(),
      userName: `${formData.firstName} ${formData.lastName}`,
      userEmail: formData.email,
      userPhone: formData.phone,
      address: formData.address,
      country: country,
      items: cartData.items.map(item => ({
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: subtotal,
      shippingFee: shipping,
      status: "en_attente"
    })
    
    // Store order data for payment page
    const orderData = {
      id: orderId,
      items: cartData.items,
      subtotal,
      shipping,
      total,
      country,
      customer: formData,
      status: "en_attente",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem("pendingOrder", JSON.stringify(orderData))
    
    // Clear cart
    localStorage.removeItem("cart")
    localStorage.removeItem("cartCheckout")
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    router.push(`/paiement?orderId=${orderId}`)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/panier">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au panier
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Finaliser la commande
                </CardTitle>
                <CardDescription>
                  Remplissez vos informations de livraison
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {/* Informations personnelles */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-primary" />
                      Informations personnelles
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prenom</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="Votre prenom"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="Votre nom"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <Mail className="h-5 w-5 text-primary" />
                      Contact
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="votre@email.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <PhoneInput
                          id="phone"
                          value={formData.phone}
                          onChange={(val) => handleInputChange("phone", val)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Livraison */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      Adresse de livraison
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Pays</Label>
                        <Select 
                          value={country} 
                          onValueChange={(value) => setCountry(value as "france" | "benin" | "cote_ivoire")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionnez un pays" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cote_ivoire">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                            <SelectItem value="france">🇫🇷 France</SelectItem>
                            <SelectItem value="benin">🇧🇯 Bénin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse complete</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Numero, rue, ville, code postal"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Traitement en cours..." : "Proceder au paiement"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Recapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3 pb-4 border-b">
                  {cartData.items.map((item) => (
                    <div key={item.bookId} className="flex gap-3">
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                        <Book className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.bookTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x {formatPrice(item.price, country)}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity, country)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(subtotal, country)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Livraison ({country === "france" ? "France" : country === "benin" ? "Bénin" : "Côte d'Ivoire"})
                    </span>
                    <span>{formatShipping(shipping, country)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatTotal(subtotal, shipping, country)}</span>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Livraison</p>
                      <p className="text-muted-foreground">
                        {shippingDelays[country] ?? shippingDelays['cote_ivoire']}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}