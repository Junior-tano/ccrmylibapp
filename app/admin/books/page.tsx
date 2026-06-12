"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Pencil,
  Trash2,
  Book,
  Upload,
  X,
  HelpCircle,
  User,
  Tag,
  Package,
} from "lucide-react"
import type { PhysicalBook } from "@/lib/types"
import { formatPriceFull } from "@/lib/currency"
import { fileToBase64 } from "@/lib/image-utils"
export default function AdminBooksPage() {
  const { physicalBooks, addPhysicalBook, updatePhysicalBook, deletePhysicalBook } = useStore()

  const [isSheetOpen, setIsSheetOpen]     = useState(false)
  const [editingBook, setEditingBook]     = useState<PhysicalBook | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookToDelete, setBookToDelete]   = useState<PhysicalBook | null>(null)
  const [coverFile, setCoverFile]         = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title:      "",
    description:"",
    author:     "",
    coverImage: "",
    price:      "" as string | number,
    stock:      "" as string | number,
  })

  const resetForm = () => {
    setFormData({ title:"", description:"", author:"", coverImage:"", price:"", stock:"" })
    setEditingBook(null)
    setCoverFile(null)
  }

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setCoverFile(file); const b64 = await fileToBase64(file); setFormData(p => ({ ...p, coverImage: b64 })) }
  }

  const isFormValid =
    formData.title.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    formData.author.trim().length > 0 &&
    (formData.price as string).toString().trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    const price = parseFloat(formData.price as string) || 0

    const bookData = {
      title:      formData.title,
      description:formData.description,
      author:     formData.author,
      coverImage: formData.coverImage || "/images/book-default.jpg",
      price:      price,
      stock:      parseInt(formData.stock as string) || 0,
    }

    if (editingBook) {
      updatePhysicalBook(editingBook.id, bookData)
    } else {
      addPhysicalBook(bookData)
    }
    setIsSheetOpen(false)
    resetForm()
  }

  const handleEdit = (book: PhysicalBook) => {
    setEditingBook(book)
    setFormData({
      title:      book.title,
      description:book.description,
      author:     book.author,
      coverImage: book.coverImage,
      price:      (book.price || 0).toString(),
      stock:      book.stock.toString(),
    })
    setIsSheetOpen(true)
  }

  const handleDeleteClick   = (book: PhysicalBook) => { setBookToDelete(book); setDeleteDialogOpen(true) }
  const handleDeleteConfirm = () => {
    if (bookToDelete) { deletePhysicalBook(bookToDelete.id); setDeleteDialogOpen(false); setBookToDelete(null) }
  }

  const inStockCount    = physicalBooks.filter(b => b.stock > 10).length
  const lowStockCount   = physicalBooks.filter(b => b.stock > 0 && b.stock <= 10).length
  const outOfStockCount = physicalBooks.filter(b => b.stock === 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Livres</h1>
          <p className="text-muted-foreground">Ajoutez et gérez votre catalogue de livres</p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />Ajouter un livre
        </Button>
      </div>

      {/* Sheet Formulaire */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) resetForm() }}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-xl p-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-start justify-between p-6 border-b bg-background shrink-0">
              <div className="space-y-1 pr-8">
                <SheetTitle className="text-xl font-semibold text-foreground">
                  {editingBook ? "Modifier le livre" : "Ajouter un nouveau livre"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Remplissez les informations du livre et les détails de stock
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsSheetOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <form id="book-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Informations principales */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Informations principales</h3>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Titre du livre <span className="text-destructive">*</span></Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: La Foi Victorieuse" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author" className="text-sm font-medium">Auteur <span className="text-destructive">*</span></Label>
                    <Input id="author" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})}
                      placeholder="Nom de l'auteur" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description <span className="text-destructive">*</span></Label>
                    <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Description du livre..." rows={3} className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary resize-none" required />
                  </div>
                </div>

                {/* Image de couverture */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Image de couverture</h3>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/30">
                      <Input id="coverFile" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleCoverFileChange} className="hidden" />
                      <label htmlFor="coverFile" className="cursor-pointer block">
                        {coverFile ? (
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-20 bg-background rounded-lg overflow-hidden shrink-0 shadow-sm">
                              <img src={URL.createObjectURL(coverFile)} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground">{coverFile.name}</p>
                              <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
                            <p className="text-sm mt-2 text-muted-foreground">Glissez une image ou <span className="text-primary font-medium">parcourir</span></p>
                            <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP (max 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverUrl" className="text-sm font-medium">Ou entrez une URL</Label>
                      <Input id="coverUrl" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})}
                        placeholder="/images/cover.jpg" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>
                  </div>
                </div>

                {/* Prix et Stock */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Prix et Stock</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">Prix (FCFA) <span className="text-destructive">*</span></Label>
                      <Input id="price" type="number" step="1" min="0" value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="15000" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock" className="text-sm font-medium">Quantité en stock <span className="text-destructive">*</span></Label>
                      <Input id="stock" type="number" min="0" value={formData.stock}
                        onChange={e => setFormData({...formData, stock: e.target.value})}
                        placeholder="50" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="border-t p-4 bg-muted/30 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Besoin d&apos;aide ?</span>
                  <button type="button" className="text-primary hover:underline">Cliquez ici</button>
                </div>
                <Button type="submit" form="book-form" disabled={!isFormValid} className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                  {editingBook ? "Enregistrer les modifications" : "Ajouter le livre"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{physicalBooks.length}</p>
                <p className="text-sm text-muted-foreground">Total livres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inStockCount}</p>
                <p className="text-sm text-muted-foreground">En stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Tag className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-muted-foreground">Stock faible</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outOfStockCount}</p>
                <p className="text-sm text-muted-foreground">Rupture de stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des livres</CardTitle>
          <CardDescription>Tous les livres physiques disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          {physicalBooks.length === 0 ? (
            <div className="text-center py-12">
              <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun livre</h3>
              <p className="text-muted-foreground mb-4">Commencez par ajouter un livre</p>
              <Button onClick={() => setIsSheetOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter un livre</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {physicalBooks.map((book) => (
                <div key={book.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${book.coverImage || "/images/placeholder.jpg"})` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                        {book.price.toLocaleString("fr-FR")} FCFA
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          book.stock > 10
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : book.stock > 0
                            ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}
                      >
                        {book.stock > 0 ? `${book.stock} en stock` : "Rupture"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-1">{book.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" /><span>{book.author}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(book)} className="h-8 w-8 hover:bg-primary/10">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(book)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="text-center max-w-sm">
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
              <rect x="18" y="26" width="44" height="46" rx="5" fill="#DBEAFE" stroke="#2563eb" strokeWidth="2.5" />
              <rect x="14" y="20" width="52" height="8" rx="4" fill="#93C5FD" stroke="#2563eb" strokeWidth="2.5" />
              <line x1="30" y1="20" x2="30" y2="17" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="40" y1="20" x2="40" y2="15" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="50" y1="20" x2="50" y2="17" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="28" y="15" width="24" height="6" rx="3" fill="#93C5FD" stroke="#2563eb" strokeWidth="2" />
              <line x1="30" y1="33" x2="30" y2="63" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="40" y1="33" x2="40" y2="63" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="50" y1="33" x2="50" y2="63" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="58" cy="22" r="10" fill="#EF4444" />
              <text x="58" y="27" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">!</text>
            </svg>
          </div>
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-center">Voulez-vous supprimer le livre &quot;{bookToDelete?.title}&quot; ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ? Aucune récupération ne sera possible après validation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <hr className="my-4" />
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction onClick={handleDeleteConfirm} className="w-full border border-red-500 bg-transparent text-red-500 hover:bg-red-50">
              Supprimer définitivement
            </AlertDialogAction>
            <AlertDialogCancel className="w-full border-none bg-transparent text-red-500 hover:bg-transparent hover:text-red-600 mt-0">
              Annuler la suppression
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
