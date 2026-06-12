"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { api } from "@/lib/api"
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Smartphone, Building, Copy, FileCheck, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/currency"

interface OrderData {
  id: string
  type?: "ebook" | "physical"
  items: {
    bookId: string
    bookTitle: string
    bookAuthor?: string
    price: number
    quantity: number
  }[]
  subtotal: number
  shipping: number
  total: number
  country: "france" | "benin" | "cote_ivoire"
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address?: string
  }
  status: string
  createdAt: string
}

function PaiementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  const { siteSettings, getOrderById, updateOrderReceipt, updateEbookOrderReceipt, addNotification, addEbookOrder, addOrder } = useStore()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Try to get order from localStorage first
    const pendingOrder = localStorage.getItem("pendingOrder")
    if (pendingOrder) {
      const parsedOrder = JSON.parse(pendingOrder)
      if (parsedOrder.id === orderId) {
        setOrder(parsedOrder)
        return
      }
    }

    // Fallback to store
    if (orderId) {
      const storeOrder = getOrderById(orderId)
      if (storeOrder) {
        setOrder({
          id: storeOrder.id,
          items: storeOrder.items.map(item => ({
            bookId: item.bookId,
            bookTitle: item.bookTitle,
            price: item.price,
            quantity: item.quantity
          })),
          subtotal: storeOrder.totalAmount,
          shipping: storeOrder.shippingFee,
          total: storeOrder.totalAmount + storeOrder.shippingFee,
          country: storeOrder.country,
          customer: {
            firstName: storeOrder.userName.split(' ')[0] || '',
            lastName: storeOrder.userName.split(' ').slice(1).join(' ') || '',
            email: storeOrder.userEmail,
            phone: storeOrder.userPhone,
            address: storeOrder.address
          },
          status: storeOrder.status,
          createdAt: storeOrder.createdAt
        })
      }
    }
  }, [orderId, getOrderById])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        alert("Format non supporte. Veuillez uploader un fichier JPG, PNG ou PDF.")
        e.target.value = "" // Reset l'input
        return
      }

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier est trop volumineux. Taille maximum: 5MB")
        e.target.value = "" // Reset l'input
        return
      }

      setUploadedFile(file)

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleChangeFile = () => {
    // Reset la valeur de l'input pour permettre de re-sélectionner le même fichier
    const input = document.getElementById("receipt") as HTMLInputElement
    if (input) {
      input.value = ""
      input.click()
    }
  }

  const handleUploadReceipt = async () => {
    if (!uploadedFile || !order) return

    setIsUploading(true)

    try {
      const isEbook = order.type === "ebook" || order.id.startsWith("EBOOK-")

      // 1. Upload du fichier reçu vers Laravel (stockage serveur)
      const { url: receiptUrl } = await api.uploadReceipt(uploadedFile)

      if (isEbook) {
        // 2a. Créer ou mettre à jour la commande e-book dans Laravel
        const existingEbook = useStore.getState().ebookOrders.find(o => o.id === order.id)
        if (existingEbook) {
          await updateEbookOrderReceipt(order.id, receiptUrl)
        } else {
          const pendingOrderData = localStorage.getItem("pendingEbookOrderData")
          const ebookData = pendingOrderData ? JSON.parse(pendingOrderData) : {}
          await addEbookOrder({
            userId: ebookData.userId ?? order.customer.email,
            userName: `${order.customer.firstName} ${order.customer.lastName}`,
            userEmail: order.customer.email,
            userPhone: order.customer.phone,
            ebookId: ebookData.ebookId ?? "",
            ebookTitle: order.items[0]?.bookTitle ?? "",
            ebookAuthor: order.items[0]?.bookAuthor ?? "",
            totalAmount: order.total,
            status: "paye",
            receiptUrl,
            pdfUrl: ebookData.pdfUrl ?? undefined,
          })
          localStorage.removeItem("pendingEbookOrderData")
        }
      } else {
        // 2b. Mettre à jour la commande physique dans Laravel (reçu + statut → payé)
        const existingOrder = getOrderById(order.id)
        if (existingOrder) {
          await updateOrderReceipt(order.id, receiptUrl)
        } else {
          // Commande absente (store vidé) : on la recrée avec le reçu
          await addOrder({
            userId: order.customer.email,
            userName: `${order.customer.firstName} ${order.customer.lastName}`,
            userEmail: order.customer.email,
            userPhone: order.customer.phone,
            address: order.customer.address ?? "",
            country: order.country,
            items: order.items.map(item => ({
              bookId: item.bookId,
              bookTitle: item.bookTitle,
              quantity: item.quantity,
              price: item.price,
            })),
            totalAmount: order.subtotal,
            shippingFee: order.shipping,
            status: "paye",
            receiptUrl,
          })
        }
      }

      // 3. Notification admin
      addNotification({
        type: "payment",
        title: isEbook ? "Reçu e-book reçu" : "Reçu de paiement reçu",
        message: `Commande ${order.id} — reçu envoyé par ${order.customer.firstName} ${order.customer.lastName}`,
        orderId: order.id,
      })

      // 4. Nettoyage localStorage pendingOrder
      localStorage.removeItem("pendingOrder")

    } catch (err) {
      console.error("Erreur upload reçu :", err)
      alert("Une erreur est survenue lors de l'envoi du reçu. Veuillez réessayer.")
    }

    setIsUploading(false)
    setUploadSuccess(true)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

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

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Commande non trouvee</h1>
        <p className="text-muted-foreground mb-6">
          Cette commande n&apos;existe pas ou a expire.
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

  if (uploadSuccess) {
    const isEbook = order.type === "ebook" || order.id.startsWith("EBOOK-")
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Recu envoye avec succes</CardTitle>
            <CardDescription>
              Votre recu de paiement a ete soumis pour verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Numero de commande: {order.id}</p>
              <p className="text-muted-foreground">
                {isEbook ? (
                  <>
                    Notre equipe va verifier votre paiement et vous envoyer l&apos;e-book par email a l&apos;adresse{" "}
                    <strong>{order.customer.email}</strong>.
                  </>
                ) : (
                  <>
                    Notre equipe va verifier votre paiement et vous contacter par email a l&apos;adresse{" "}
                    <strong>{order.customer.email}</strong> pour confirmer l&apos;expedition.
                  </>
                )}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Delai de verification: 24 a 48 heures ouvrables
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full" asChild>
              <Link href="/">
                Retour a l&apos;accueil
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={isEbook ? "/ebooks" : "/livres"}>
                Continuer les achats
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const isEbookOrder = order.type === "ebook" || order.id.startsWith("EBOOK-")
  
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href={isEbookOrder ? "/ebooks" : "/livres"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isEbookOrder ? "Retour aux e-books" : "Retour aux livres"}
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Order Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Commande {order.id}</CardTitle>
              <CardDescription>
                {order.items.length} article(s) - Total: {formatPrice(order.total, order.country)}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Payment Instructions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions de paiement</CardTitle>
                <CardDescription>
                  Effectuez votre paiement via l&apos;un des moyens suivants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="mobile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="mobile" className="gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile Money
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="gap-2">
                      <Building className="h-4 w-4" />
                      Virement
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="mobile" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Envoyez le montant de <strong>{formatPrice(order.total, order.country)}</strong> via Mobile Money:
                    </p>
                    {siteSettings.mobileMoney.map((mobile, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">
                            {mobile.provider === "wave" ? "Wave" :
                              mobile.provider === "orange_money" ? "Orange Money" : "Moov Money"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Numero</p>
                            <p className="font-mono">{mobile.number}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(mobile.number, `mobile-${index}`)}
                          >
                            {copiedField === `mobile-${index}` ? (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nom: {mobile.name}
                        </p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="bank" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Effectuez un virement de <strong>{formatPrice(order.total, order.country)}</strong>:
                    </p>
                    {siteSettings.bankAccounts.map((account, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <p className="font-semibold text-primary">{account.bankName}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-muted-foreground">Titulaire: </span>
                              <span>{account.accountName}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(account.accountName, `name-${index}`)}
                            >
                              {copiedField === `name-${index}` ? (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-muted-foreground">Numero: </span>
                              <span className="font-mono">{account.accountNumber}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(account.accountNumber, `account-${index}`)}
                            >
                              {copiedField === `account-${index}` ? (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {account.iban && (
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-muted-foreground">IBAN: </span>
                                <span className="font-mono text-xs">{account.iban}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(account.iban || "", `iban-${index}`)}
                              >
                                {copiedField === `iban-${index}` ? (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                <div className="mt-6 bg-secondary/20 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Important:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>- Indiquez le numero de commande <strong>{order.id}</strong> en reference</li>
                    <li>- Conservez votre recu de paiement</li>
                    <li>- Uploadez le recu ci-contre pour validation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Envoyer le recu de paiement
                </CardTitle>
                <CardDescription>
                  Apres avoir effectue le paiement, uploadez votre recu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt">Fichier (JPG, PNG ou PDF)</Label>

                  {/* Input caché — toujours présent dans le DOM */}
                  <Input
                    id="receipt"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    {uploadedFile ? (
                      <div className="space-y-2">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Apercu"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 mx-auto bg-muted rounded-lg flex items-center justify-center">
                            <FileCheck className="h-8 w-8 text-primary" />
                          </div>
                        )}
                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {/* Bouton HORS du label pour éviter la double propagation */}
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={handleChangeFile}
                        >
                          Changer de fichier
                        </Button>
                      </div>
                    ) : (
                      <label htmlFor="receipt" className="cursor-pointer block">
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="font-medium">Cliquez pour uploader</p>
                          <p className="text-sm text-muted-foreground">
                            ou glissez-deposez votre fichier ici
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Formats acceptes: JPG, PNG, PDF (max 5MB)
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleUploadReceipt}
                  disabled={!uploadedFile || isUploading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Envoyer le recu
                    </>
                  )}
                </Button>

                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Statut de la commande</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span className="text-muted-foreground">En attente de paiement</span>
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

export default function PaiementPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-muted rounded w-64 mx-auto" />
        </div>
      </div>
    }>
      <PaiementContent />
    </Suspense>
  )
}