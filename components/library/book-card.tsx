"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { PhysicalBook, Ebook } from "@/lib/types"
import { ShoppingCart, Download, BookOpen, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthModal } from "@/components/library/auth-modal"

interface BookCardProps {
  book: PhysicalBook | Ebook
  type: "physical" | "ebook"
}

export function BookCard({ book, type }: BookCardProps) {
  const { toast } = useToast()
  const { requireAuth } = useAuthModal()
  const router = useRouter()
  const isEbook = type === "ebook"
  const ebook = book as Ebook
  const physicalBook = book as PhysicalBook

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: book.description,
          url: window.location.href,
        })
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Lien copie",
        description: "Le lien a ete copie dans le presse-papier",
      })
    }
  }

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    requireAuth(() => {
      if (isEbook) {
        router.push(`/ebooks/${book.id}/acheter`)
      } else {
        router.push(`/livres/${book.id}/commander`)
      }
    })
  }

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const savedUser = localStorage.getItem("user")
    if (!savedUser) {
      e.preventDefault()
      requireAuth(() => {
        // After auth, trigger download
        if (ebook.pdfUrl) {
          const link = document.createElement("a")
          link.href = ebook.pdfUrl
          link.download = `${ebook.title}.pdf`
          link.click()
        }
      })
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImage}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {isEbook && ebook.isFree && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            Gratuit
          </div>
        )}
        {!isEbook && physicalBook.stock === 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
            Rupture
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <div>
          <h3 className="font-medium text-sm leading-tight line-clamp-1">{book.title}</h3>
          <p className="text-xs text-primary">{book.author}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Button 
            variant="default"
            size="sm"
            className="w-full h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleShare}
          >
            <Share2 className="h-3 w-3 mr-1.5" />
            Partager
          </Button>
          {isEbook ? (
            ebook.isFree && ebook.pdfUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-7 text-xs"
                asChild
              >
                <a href={ebook.pdfUrl} download onClick={handleDownloadClick}>
                  <Download className="h-3 w-3 mr-1.5" />
                  Telecharger
                </a>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-7 text-xs"
                onClick={handleBuyClick}
              >
                <ShoppingCart className="h-3 w-3 mr-1.5" />
                {book.price.toLocaleString("fr-FR")} FCFA
              </Button>
            )
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-7 text-xs"
              disabled={physicalBook.stock === 0}
              onClick={handleBuyClick}
            >
              <ShoppingCart className="h-3 w-3 mr-1.5" />
              Commander
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
