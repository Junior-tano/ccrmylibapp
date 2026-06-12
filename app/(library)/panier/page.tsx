"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store"
import type { PhysicalBook } from "@/lib/types"
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Book, ArrowLeft } from "lucide-react"
import { formatPrice, formatPriceFull } from "@/lib/currency"

interface CartItem {
  bookId: string
  quantity: number
}

export default function PanierPage() {
  const router = useRouter()
  const physicalBooks = useStore((state) => state.physicalBooks)
  const shippingFees = useStore((state) => state.shippingFees)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [country, setCountry] = useState<"france" | "benin">("france")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Charger le panier depuis localStorage
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
    setIsLoading(false)
  }, [])

  const saveCart = (items: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(items))
    setCartItems(items)
  }

  const getBook = (bookId: string): PhysicalBook | undefined => {
    return physicalBooks.find(b => b.id === bookId)
  }

  const updateQuantity = (bookId: string, newQuantity: number) => {
    const book = getBook(bookId)
    if (!book) return
    
    if (newQuantity <= 0) {
      removeItem(bookId)
      return
    }
    
    if (newQuantity > book.stock) {
      newQuantity = book.stock
    }
    
    const newItems = cartItems.map(item => 
      item.bookId === bookId ? { ...item, quantity: newQuantity } : item
    )
    saveCart(newItems)
  }

  const removeItem = (bookId: string) => {
    const newItems = cartItems.filter(item => item.bookId !== bookId)
    saveCart(newItems)
  }

  const clearCart = () => {
    saveCart([])
  }

  const subtotal = cartItems.reduce((total, item) => {
    const book = getBook(item.bookId)
    return total + (book ? book.price * item.quantity : 0)
  }, 0)

  const shipping = shippingFees[country]
  const totalAmount = subtotal + shipping

  const handleCheckout = () => {
    // Stocker les informations pour la page de commande
    const cartData = {
      items: cartItems.map(item => {
        const book = getBook(item.bookId)
        return {
          bookId: item.bookId,
          bookTitle: book?.title || "",
          price: book?.price || 0,
          quantity: item.quantity,
        }
      }),
      subtotal,
      shipping,
      total: totalAmount,
      country,
    }
    localStorage.setItem("cartCheckout", JSON.stringify(cartData))
    router.push("/panier/commander")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-muted rounded w-64 mx-auto" />
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Votre panier est vide</h1>
        <p className="text-muted-foreground mb-6">
          Decouvrez notre catalogue de livres et commencez vos achats
        </p>
        <Button asChild>
          <Link href="/livres">
            <Book className="h-4 w-4 mr-2" />
            Voir les livres
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/livres">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuer les achats
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Mon Panier
                    </CardTitle>
                    <CardDescription>
                      {cartItems.length} article{cartItems.length > 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vider
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => {
                  const book = getBook(item.bookId)
                  if (!book) return null
                  
                  return (
                    <div key={item.bookId} className="flex gap-4 py-4 border-b last:border-0">
                      <div className="w-20 h-24 bg-muted rounded flex items-center justify-center shrink-0">
                        <Book className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold line-clamp-1">{book.title}</h3>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                        <p className="text-primary font-medium mt-1">
                          {formatPriceFull(book.price).fcfa}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                            disabled={item.quantity >= book.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({book.stock} disponibles)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPriceFull(book.price * item.quantity).fcfa}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive mt-2"
                          onClick={() => removeItem(item.bookId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Recapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(subtotal, country)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pays de livraison</label>
                  <Select 
                    value={country} 
                    onValueChange={(value) => setCountry(value as "france" | "benin")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="france">France - {formatPrice(shippingFees.france, "france")}</SelectItem>
                      <SelectItem value="benin">Benin - {formatPrice(shippingFees.benin, "benin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Frais de livraison</span>
                  <span>{formatPrice(shipping, country)}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalAmount, country)}</span>
                  </div>
                  {country === "france" && (
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {formatPriceFull(totalAmount).eur}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleCheckout}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Commander
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
