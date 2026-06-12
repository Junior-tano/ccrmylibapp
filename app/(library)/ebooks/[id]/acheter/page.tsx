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
import type { Ebook } from "@/lib/types"
import { ArrowLeft, BookOpen, User, Mail } from "lucide-react"
import { formatPrice } from "@/lib/currency"

export default function AcheterEbookPage() {
  const router = useRouter()
  const params = useParams()
  const ebookId = params.id as string
  const ebooks = useStore((state) => state.ebooks)
  const addEbookOrder = useStore((state) => state.addEbookOrder)
  
  const [ebook, setEbook] = useState<Ebook | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [country, setCountry] = useState<"france" | "benin" | "cote_ivoire">("cote_ivoire")
  // Formulaire vide — l'utilisateur remplit lui-même (Objectif 2)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const foundEbook = ebooks.find(e => e.id === ebookId)
    if (foundEbook) {
      setEbook(foundEbook)
      // If the ebook is free, redirect to download
      if (foundEbook.isFree && foundEbook.pdfUrl) {
        router.push(foundEbook.pdfUrl)
      }
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
      })
    }
  }, [ebookId, ebooks, router])

  if (!ebook) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">E-book non trouve</h1>
        <p className="text-muted-foreground mb-6">
          Cet e-book n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Button asChild>
          <Link href="/ebooks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux e-books
          </Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const savedUser = localStorage.getItem("user")
    const currentUser = savedUser ? JSON.parse(savedUser) : null

    // Enregistre la commande e-book dans Laravel dès la soumission
    const orderId = await addEbookOrder({
      userId: currentUser?.id ?? `user-${Date.now()}`,
      userName: `${formData.firstName} ${formData.lastName}`,
      userEmail: formData.email,
      userPhone: formData.phone,
      ebookId: ebook.id,
      ebookTitle: ebook.title,
      ebookAuthor: ebook.author,
      totalAmount: ebook.price,
      status: "en_attente",
      pdfUrl: ebook.pdfUrl ?? undefined,
    })

    // Garde les données pour la page de paiement
    const orderData = {
      id: orderId,
      type: "ebook",
      items: [{ bookId: ebook.id, bookTitle: ebook.title, bookAuthor: ebook.author, price: ebook.price, quantity: 1 }],
      subtotal: ebook.price,
      shipping: 0,
      total: ebook.price,
      country,
      customer: formData,
      status: "en_attente",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem("pendingOrder", JSON.stringify(orderData))

    // Métadonnées e-book pour la page paiement (reçu upload)
    localStorage.setItem("pendingEbookOrderData", JSON.stringify({
      ebookId: ebook.id,
      pdfUrl: ebook.pdfUrl ?? null,
      userId: currentUser?.id ?? `user-${Date.now()}`,
    }))

    router.push(`/paiement?orderId=${orderId}`)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Affichage du prix selon le pays (Objectif 3)
  const priceDisplay = formatPrice(ebook.price, country)

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/ebooks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux e-books
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Commander - {ebook.title}
                </CardTitle>
                <CardDescription>
                  Remplissez le formulaire pour acheter cet e-book
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {/* Personal Information */}
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

                  {/* Pays */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      Pays
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="country">Sélectionnez votre pays *</Label>
                      <Select
                        value={country}
                        onValueChange={(v) => setCountry(v as "france" | "benin" | "cote_ivoire")}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un pays" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cote_ivoire">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                          <SelectItem value="benin">🇧🇯 Bénin</SelectItem>
                          <SelectItem value="france">🇫🇷 France</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <p className="text-xs text-muted-foreground">
                          L&apos;e-book sera envoye a cette adresse
                        </p>
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

                  {/* Ebook Info */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-16 bg-primary/10 rounded flex items-center justify-center shrink-0">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{ebook.title}</p>
                        <p className="text-sm text-muted-foreground">{ebook.author}</p>
                        <p className="text-xs text-muted-foreground mt-1">Format PDF - Livraison par email</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
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
                {/* Ebook Info */}
                <div className="flex gap-4 pb-4 border-b">
                  <div className="w-16 h-20 bg-muted rounded flex items-center justify-center shrink-0">
                    {ebook.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ebook.coverImage}
                        alt={ebook.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold line-clamp-2">{ebook.title}</h4>
                    <p className="text-sm text-muted-foreground">{ebook.author}</p>
                    <p className="text-xs text-muted-foreground mt-1">Format PDF</p>
                  </div>
                </div>

                {/* Price breakdown — Objectif 3 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>E-book</span>
                    <span>{priceDisplay}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Livraison</span>
                    <span>Gratuite (par email)</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{priceDisplay}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Livraison par email</p>
                      <p className="text-muted-foreground">
                        Vous recevrez votre e-book par email apres validation du paiement (24-48h)
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