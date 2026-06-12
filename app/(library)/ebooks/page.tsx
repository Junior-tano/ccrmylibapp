"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookCard } from "@/components/library/book-card"
import { useStore } from "@/lib/store"
import { Search, BookOpen } from "lucide-react"

export default function EbooksPage() {
  const ebooks = useStore((state) => state.ebooks)
  const [searchQuery, setSearchQuery] = useState("")
  const [priceFilter, setPriceFilter] = useState<string>("all")

  const filteredEbooks = ebooks.filter(ebook => {
    const matchesSearch = 
      ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ebook.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ebook.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesPrice = true
    if (priceFilter === "free") {
      matchesPrice = ebook.isFree
    } else if (priceFilter === "paid") {
      matchesPrice = !ebook.isFree
    }
    
    return matchesSearch && matchesPrice
  })

  // Separate free ebooks
  const freeEbooks = filteredEbooks.filter(e => e.isFree)
  const paidEbooks = filteredEbooks.filter(e => !e.isFree)

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">E-books</h1>
              <p className="text-muted-foreground">Livres numeriques a telecharger</p>
            </div>
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
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par prix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les e-books</SelectItem>
              <SelectItem value="free">Gratuits</SelectItem>
              <SelectItem value="paid">Payants</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          {filteredEbooks.length} e-book{filteredEbooks.length !== 1 ? 's' : ''} trouve{filteredEbooks.length !== 1 ? 's' : ''}
        </p>

        {/* Free Ebooks */}
        {freeEbooks.length > 0 && priceFilter !== "paid" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">E-books gratuits</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {freeEbooks.map((ebook) => (
                <BookCard key={ebook.id} book={ebook} type="ebook" />
              ))}
            </div>
          </div>
        )}

        {/* Paid Ebooks */}
        {paidEbooks.length > 0 && priceFilter !== "free" && (
          <div>
            {freeEbooks.length > 0 && priceFilter === "all" && (
              <h2 className="text-xl font-semibold mb-4">E-books payants</h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {paidEbooks.map((ebook) => (
                <BookCard key={ebook.id} book={ebook} type="ebook" />
              ))}
            </div>
          </div>
        )}

        {filteredEbooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun e-book trouve</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos criteres de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
