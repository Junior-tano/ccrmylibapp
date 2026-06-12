"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  BookOpen,
  Upload,
  X,
  HelpCircle,
  User,
  Tag,
} from "lucide-react"
import type { Ebook } from "@/lib/types"
import { formatPriceFull } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { fileToBase64 } from "@/lib/image-utils"

export default function AdminEbooksPage() {
  const { ebooks, addEbook, updateEbook, deleteEbook } = useStore()

  const [isSheetOpen, setIsSheetOpen]     = useState(false)
  const [editingEbook, setEditingEbook]   = useState<Ebook | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ebookToDelete, setEbookToDelete] = useState<Ebook | null>(null)
  const [pdfFile, setPdfFile]     = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title:      "",
    description:"",
    author:     "",
    coverImage: "",
    price:      "" as string | number,
    isFree:     false,
    pdfUrl:     "",
  })

  const resetForm = () => {
    setFormData({ title:"", description:"", author:"", coverImage:"", price:"", isFree:false, pdfUrl:"" })
    setEditingEbook(null)
    setPdfFile(null)
    setCoverFile(null)
  }

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setPdfFile(file); setFormData(p => ({ ...p, pdfUrl: `/ebooks/${file.name}` })) }
  }

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setCoverFile(file); const b64 = await fileToBase64(file); setFormData(p => ({ ...p, coverImage: b64 })) }
  }

  const isFormValid =
    formData.title.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    formData.author.trim().length > 0 &&
    (formData.isFree || (formData.price as string).toString().trim().length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    const price = formData.isFree ? 0 : parseFloat(formData.price as string) || 0

    const ebookData = {
      title:      formData.title,
      description:formData.description,
      author:     formData.author,
      coverImage: formData.coverImage || "/images/ebook-default.jpg",
      price:      price,
      isFree:     formData.isFree,
      pdfUrl:     formData.pdfUrl,
    }

    if (editingEbook) {
      updateEbook(editingEbook.id, ebookData)
    } else {
      addEbook(ebookData)
    }
    setIsSheetOpen(false)
    resetForm()
  }

  const handleEdit = (ebook: Ebook) => {
    setEditingEbook(ebook)
    setFormData({
      title:      ebook.title,
      description:ebook.description,
      author:     ebook.author,
      coverImage: ebook.coverImage,
      price:      ebook.isFree ? "" : (ebook.price || 0).toString(),
      isFree:     ebook.isFree,
      pdfUrl:     ebook.pdfUrl ?? "",
    })
    setIsSheetOpen(true)
  }

  const handleDeleteClick   = (ebook: Ebook) => { setEbookToDelete(ebook); setDeleteDialogOpen(true) }
  const handleDeleteConfirm = () => {
    if (ebookToDelete) { deleteEbook(ebookToDelete.id); setDeleteDialogOpen(false); setEbookToDelete(null) }
  }

  const freeCount  = ebooks.filter(e => e.isFree).length
  const paidCount  = ebooks.filter(e => !e.isFree).length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des E-books</h1>
          <p className="text-muted-foreground">Ajoutez et gérez vos livres numériques</p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />Ajouter un e-book
        </Button>
      </div>

      {/* ── Sheet Formulaire ── */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) resetForm() }}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-xl p-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-start justify-between p-6 border-b bg-background shrink-0">
              <div className="space-y-1 pr-8">
                <SheetTitle className="text-xl font-semibold text-foreground">
                  {editingEbook ? "Modifier l'e-book" : "Ajouter un nouvel e-book"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Remplissez les informations et téléchargez le fichier PDF
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsSheetOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <form id="ebook-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Informations principales */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Informations principales</h3>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Titre de l&apos;e-book <span className="text-destructive">*</span></Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Guide de prière" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author" className="text-sm font-medium">Auteur <span className="text-destructive">*</span></Label>
                    <Input id="author" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})}
                      placeholder="Nom de l'auteur" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description <span className="text-destructive">*</span></Label>
                    <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Description de l'e-book..." rows={3} className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary resize-none" required />
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

                {/* Fichier PDF */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Fichier PDF</h3>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/30">
                      <Input id="pdfFile" type="file" accept=".pdf" onChange={handlePdfFileChange} className="hidden" />
                      <label htmlFor="pdfFile" className="cursor-pointer block">
                        {pdfFile ? (
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-14 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                              <BookOpen className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground">{pdfFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
                            <p className="text-sm mt-2 text-muted-foreground">Glissez le fichier PDF ou <span className="text-primary font-medium">parcourir</span></p>
                            <p className="text-xs text-muted-foreground/70 mt-1">PDF uniquement (max 50MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pdfUrl" className="text-sm font-medium">Ou entrez une URL</Label>
                      <Input id="pdfUrl" value={formData.pdfUrl} onChange={e => setFormData({...formData, pdfUrl: e.target.value})}
                        placeholder="https://example.com/ebook.pdf" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>
                  </div>
                </div>

                {/* Tarification */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Tarification</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label htmlFor="isFree" className="text-sm font-medium cursor-pointer">E-book gratuit</Label>
                        <p className="text-xs text-muted-foreground">Rendre cet e-book accessible gratuitement</p>
                      </div>
                      <Switch id="isFree" checked={formData.isFree}
                        onCheckedChange={checked => setFormData({...formData, isFree: checked, price: checked ? "" : formData.price})} />
                    </div>
                    {!formData.isFree && (
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-medium">Prix (FCFA) <span className="text-destructive">*</span></Label>
                        <Input id="price" type="number" step="1" min="0" value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value})}
                          placeholder="5000" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required={!formData.isFree} />
                      </div>
                    )}
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
                <Button type="submit" form="ebook-form" disabled={!isFormValid} className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                  {editingEbook ? "Enregistrer les modifications" : "Ajouter l'e-book"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ebooks.length}</p>
                <p className="text-sm text-muted-foreground">Total e-books</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{freeCount}</p>
                <p className="text-sm text-muted-foreground">Gratuits</p>
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
                <p className="text-2xl font-bold">{paidCount}</p>
                <p className="text-sm text-muted-foreground">Payants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Liste ── */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des e-books</CardTitle>
          <CardDescription>Tous les e-books disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          {ebooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun e-book</h3>
              <p className="text-muted-foreground mb-4">Commencez par ajouter un e-book</p>
              <Button onClick={() => setIsSheetOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter un e-book</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ebooks.map((ebook) => (
                <div key={ebook.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  {/* Couverture */}
                  <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${ebook.coverImage || "/images/placeholder.jpg"})` }} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {ebook.isFree ? (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Gratuit</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                          {ebook.price.toLocaleString("fr-FR")} FCFA
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">PDF</Badge>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-1">{ebook.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" /><span>{ebook.author}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(ebook)} className="h-8 w-8 hover:bg-primary/10">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(ebook)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog Suppression ── */}
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
            <AlertDialogTitle className="text-center">Voulez-vous supprimer l&apos;e-book &quot;{ebookToDelete?.title}&quot; ?</AlertDialogTitle>
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
