"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Search, ShoppingCart, User, LogIn, UserPlus } from "lucide-react"
import { useStore } from "@/lib/store"

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "Podcasts", href: "/podcasts" },
  { name: "Enseignements", href: "/videos" },
  { name: "E-books", href: "/ebooks" },
  { name: "Livres", href: "/livres" },
  { name: "Programmes", href: "/a-venir" },
  { name: "Contactez-nous", href: "/contact" },
]

export function Header() {
  const pathname = usePathname()
  const siteSettings = useStore((state) => state.siteSettings)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        const cart = JSON.parse(savedCart)
        const total = cart.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0)
        setCartCount(total)
      } else {
        setCartCount(0)
      }
    }

    const checkAuthStatus = () => {
      const savedUser = localStorage.getItem("user")
      setIsLoggedIn(!!savedUser)
    }
    
    updateCartCount()
    checkAuthStatus()
    window.addEventListener("cartUpdated", updateCartCount)
    window.addEventListener("storage", updateCartCount)
    window.addEventListener("storage", checkAuthStatus)
    window.addEventListener("userLoggedIn", checkAuthStatus)
    window.addEventListener("userLoggedOut", checkAuthStatus)
    
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount)
      window.removeEventListener("storage", updateCartCount)
      window.removeEventListener("storage", checkAuthStatus)
      window.removeEventListener("userLoggedIn", checkAuthStatus)
      window.removeEventListener("userLoggedOut", checkAuthStatus)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-3 shrink-0 -ml-2">
            {siteSettings.logoUrl ? (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden shadow-sm relative bg-background">
                <img
                  src={siteSettings.logoUrl}
                  alt={siteSettings.siteName || "Logo"}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm md:text-base">CCR</span>
              </div>
            )}
            <p className="font-bold text-base md:text-lg text-foreground whitespace-nowrap hidden sm:block">
              {siteSettings.siteName || "Centre Chretien de Reveil"}
            </p>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted/50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions - Right */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Search */}
            <div className={cn(
              "hidden sm:flex items-center transition-all",
              searchOpen ? "w-48" : "w-auto"
            )}>
              {searchOpen ? (
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-9 pr-8 h-9"
                    autoFocus
                    onBlur={() => setSearchOpen(false)}
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Cart */}
            <Link href="/panier">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Account */}
            {isLoggedIn ? (
              <Link href="/compte">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/compte?tab=register" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="h-9 px-4 text-sm rounded-full border-primary/30">
                    Inscription
                  </Button>
                </Link>
                <Link href="/compte?tab=login" className="hidden sm:block">
                  <Button size="sm" className="h-9 px-4 text-sm rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Connexion
                  </Button>
                </Link>
                <Link href="/compte" className="sm:hidden">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="mt-4 px-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-9" />
              </div>
            </div>

            {/* Mobile Auth Buttons */}
            {!isLoggedIn && (
              <div className="mt-4 px-4 flex gap-2">
                <Link href="/compte?tab=register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Inscription
                  </Button>
                </Link>
                <Link href="/compte?tab=login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Connexion
                  </Button>
                </Link>
              </div>
            )}
            {isLoggedIn && (
              <div className="mt-4 px-4">
                <Link href="/compte" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Mon Compte
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
