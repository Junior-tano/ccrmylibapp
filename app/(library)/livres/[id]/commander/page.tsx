"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store"
import type { PhysicalBook } from "@/lib/types"
import { ArrowLeft, Book, Truck, CreditCard, User, MapPin, Phone, Mail } from "lucide-react"
import { formatPrice, formatShipping, formatTotal, eurToFcfa } from "@/lib/currency"

export default function CommanderLivrePage() {
  const router = useRouter()
  const params = useParams()
  const bookId = params.id as string
  const physicalBooks = useStore((state) => state.physicalBooks)
  const shippingFees = useStore((state) => state.shippingFees)
  const shippingDelays = useStore((state) => state.shippingDelays)
  const addOrder = useStore((state) => state.addOrder)
  
  const [book, setBook] = useState<PhysicalBook | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [country, setCountry] = useState<"france" | "benin" | "cote_ivoire">("cote_ivoire")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    const foundBook = physicalBooks.find(b => b.id === bookId)
    if (foundBook) {
      setBook(foundBook)
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
  }, [bookId, physicalBooks])

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Book className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Livre non trouve</h1>
        <p className="text-muted-foreground mb-6">
          Ce livre n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Button asChild>
          <Link href="/livres">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux livres
          </Link>
        </Button>
      </div>
    )
  }

  const subtotal = book.price * quantity
  const shipping = shippingFees[country] ?? shippingFees["benin"] ?? 0
  // total toujours en FCFA pour cohérence du stockage
  const shippingFcfa = country === "france" ? eurToFcfa(shipping) : shipping
  const total = subtotal + shippingFcfa

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const savedUser = localStorage.getItem("user")
    const currentUser = savedUser ? JSON.parse(savedUser) : null

    // Enregistre la commande dans Laravel dès la soumission du formulaire
    const orderId = await addOrder({
      userId: currentUser?.id ?? Date.now().toString(),
      userName: `${formData.firstName} ${formData.lastName}`,
      userEmail: formData.email,
      userPhone: formData.phone,
      address: formData.address,
      country,
      items: [{ bookId: book.id, bookTitle: book.title, price: book.price, quantity }],
      totalAmount: subtotal,
      shippingFee: shipping,
      status: "en_attente",
    })

    // Garde les données en localStorage pour affichage sur la page de paiement
    const orderData = {
      id: orderId,
      items: [{ bookId: book.id, bookTitle: book.title, price: book.price, quantity }],
      subtotal,
      shipping,
      total,
      country,
      customer: formData,
      status: "en_attente",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem("pendingOrder", JSON.stringify(orderData))

    router.push(`/paiement?orderId=${orderId}`)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/livres">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux livres
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Commander - {book.title}
                </CardTitle>
                <CardDescription>
                  Remplissez le formulaire pour passer votre commande
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
                        <Label htmlFor="firstName">Prenom *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="Votre prenom"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom *</Label>
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
                        <Label htmlFor="email">Email *</Label>
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
                        <Label htmlFor="phone">Téléphone *</Label>
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
                        <Label htmlFor="country">Pays *</Label>
                        <Select 
                          value={country} 
                          onValueChange={(value) => setCountry(value as "france" | "benin" | "cote_ivoire")}
                          required
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
                        <Label htmlFor="address">Adresse complete *</Label>
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

                  {/* Quantite */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <Book className="h-5 w-5 text-primary" />
                      Quantite
                    </h3>
                    <div className="flex items-center gap-4">
                      <Select 
                        value={quantity.toString()} 
                        onValueChange={(value) => setQuantity(parseInt(value))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <SelectItem 
                              key={n} 
                              value={n.toString()}
                              disabled={n > book.stock}
                            >
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        {book.stock} exemplaire{book.stock > 1 ? "s" : ""} disponible{book.stock > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    disabled={isSubmitting || book.stock === 0}
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
                {/* Book Info */}
                <div className="flex gap-4 pb-4 border-b">
                  <div className="w-16 h-20 bg-muted rounded flex items-center justify-center shrink-0">
                    <Book className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <div>
                    <h4 className="font-semibold line-clamp-2">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <div className="mt-1">
                      <p className="text-sm font-medium text-primary">
                        {formatPrice(book.price, country)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total ({quantity} x {formatPrice(book.price, country)})</span>
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
                      <p className="font-medium">Information de livraison</p>
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