"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookCard } from "@/components/library/book-card"
import { useStore } from "@/lib/store"
import { Search, Book, Truck } from "lucide-react"

export default function LivresPage() {
  const physicalBooks = useStore((state) => state.physicalBooks)
  const [searchQuery, setSearchQuery] = useState("")
  const [stockFilter, setStockFilter] = useState<string>("all")

  const filteredBooks = physicalBooks.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesStock = true
    if (stockFilter === "available") {
      matchesStock = book.stock > 0
    } else if (stockFilter === "out") {
      matchesStock = book.stock === 0
    }
    
    return matchesSearch && matchesStock
  })

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <Book className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Livres Physiques</h1>
              <p className="text-muted-foreground">A commander et recevoir chez vous</p>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-muted rounded-lg p-4 mb-8 flex items-start gap-3">
          <Truck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Livraison disponible</p>
            <p className="text-sm text-muted-foreground">
              Nous livrons en France et au Benin. Les frais de livraison sont calcules automatiquement lors de la commande.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre, auteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les livres</SelectItem>
              <SelectItem value="available">En stock</SelectItem>
              <SelectItem value="out">Rupture de stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          {filteredBooks.length} livre{filteredBooks.length !== 1 ? 's' : ''} trouve{filteredBooks.length !== 1 ? 's' : ''}
        </p>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} type="physical" />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Book className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun livre trouve</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos criteres de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
