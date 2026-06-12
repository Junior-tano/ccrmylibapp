"use client"

import { useState, useRef } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  Image as ImageIcon,
  Eye,
  EyeOff,
  GripVertical,
  Sparkles,
  X,
  HelpCircle,
  Upload
} from "lucide-react"
import type { HeroSlide } from "@/lib/types"
import { cn } from "@/lib/utils"
import { fileToBase64 } from "@/lib/image-utils"

export default function AdminHeroPage() {
  const { heroSlides, addHeroSlide, updateHeroSlide, deleteHeroSlide, toggleHeroSlideActive, loadApiData } = useStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    buttonText: "",
    buttonLink: "",
    isActive: true
  })

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image: "",
      buttonText: "",
      buttonLink: "",
      isActive: true
    })
    setEditingSlide(null)
    setImageFile(null)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
    setSubmitError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const MAX_IMAGE_SIZE = 4 * 1024 * 1024 // 4 Mo

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE) {
      setSubmitError("L'image ne doit pas dépasser 4 Mo.")
      return
    }
    setSubmitError("")
    setImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(previewUrl)
    const base64 = await fileToBase64(file)
    setFormData(prev => ({ ...prev, image: base64 }))
  }

  const isFormValid = formData.title.trim().length > 0 && formData.description.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError("")

    const slideData = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      description: formData.description.trim(),
      image: formData.image.trim() || undefined,
      buttonText: formData.buttonText.trim() || undefined,
      buttonLink: formData.buttonLink.trim() || undefined,
      isActive: formData.isActive
    }

    try {
      if (editingSlide) {
        await updateHeroSlide(editingSlide.id, slideData)
      } else {
        await addHeroSlide(slideData)
      }
      await loadApiData()
      setIsSheetOpen(false)
      resetForm()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Impossible d'enregistrer le slide")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      image: slide.image || "",
      buttonText: slide.buttonText || "",
      buttonLink: slide.buttonLink || "",
      isActive: slide.isActive
    })
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
    setImageFile(null)
    setIsSheetOpen(true)
  }

  const handleDeleteClick = (slide: HeroSlide) => {
    setSlideToDelete(slide)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (slideToDelete) {
      deleteHeroSlide(slideToDelete.id)
      setDeleteDialogOpen(false)
      setSlideToDelete(null)
    }
  }

  const activeSlides = heroSlides.filter(s => s.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hero Section</h1>
          <p className="text-muted-foreground">
            Gérez les slides de la section hero de la page d&apos;accueil
          </p>
        </div>
        <Button
          onClick={() => setIsSheetOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un slide
        </Button>
      </div>

      {/* Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        setIsSheetOpen(open)
        if (!open) resetForm()
      }}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-xl p-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          <div className="flex flex-col min-h-0 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b bg-background shrink-0">
              <div className="space-y-1 pr-8">
                <SheetTitle className="text-xl font-semibold text-foreground">
                  {editingSlide ? "Modifier le slide" : "Ajouter un nouveau slide"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Remplissez les informations du slide hero
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsSheetOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <form id="hero-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Section: Textes */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Textes du slide
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Titre <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Bienvenue dans notre Librairie"
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                        required
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="subtitle" className="text-sm font-medium">
                        Sous-titre
                      </Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                        placeholder="Centre Chrétien de Réveil"
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Découvrez des enseignements et ressources pour votre édification..."
                        rows={3}
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary resize-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Image */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Image de fond
                  </h3>

                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/30">
                      <Input
                        id="imageFile"
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <label htmlFor="imageFile" className="cursor-pointer block">
                        {(() => {
                          const previewSrc = imagePreviewUrl || formData.image
                          if (previewSrc) {
                            return (
                              <div className="flex items-center gap-4">
                                <div className="w-24 h-14 bg-background rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                  <img
                                    src={previewSrc}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium text-foreground">{imageFile ? imageFile.name : "Image sélectionnée"}</p>
                                  <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <div className="py-4">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
                              <p className="text-sm mt-2 text-muted-foreground">
                                Glissez une image ou <span className="text-primary font-medium">parcourir</span>
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1">Recommandé : 1920×1080 (max 4 Mo)</p>
                            </div>
                          )
                        })()}
                      </label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-sm font-medium">
                        Ou entrez une URL
                      </Label>
                      <Input
                        id="imageUrl"
                        value={formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                        placeholder="/images/hero-1.jpg"
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Bouton CTA */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Bouton d&apos;action (optionnel)
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buttonText" className="text-sm font-medium">
                        Texte du bouton
                      </Label>
                      <Input
                        id="buttonText"
                        value={formData.buttonText}
                        onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                        placeholder="Explorer les podcasts"
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buttonLink" className="text-sm font-medium">
                        Lien du bouton
                      </Label>
                      <Input
                        id="buttonLink"
                        value={formData.buttonLink}
                        onChange={(e) => setFormData({...formData, buttonLink: e.target.value})}
                        placeholder="/podcasts"
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Visibilité */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Visibilité
                  </h3>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                        Slide actif
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Le slide sera affiché dans le carrousel
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                  </div>
                </div>

                {submitError && (
                  <p className="text-sm text-destructive">{submitError}</p>
                )}

              </form>
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-muted/30 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Besoin d&apos;aide ?</span>
                  <button type="button" className="text-primary hover:underline">
                    Cliquez ici
                  </button>
                </div>
                <Button
                  type="submit"
                  form="hero-form"
                  disabled={!isFormValid || isSubmitting}
                  className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white px-6"
                >
                  {isSubmitting ? "Enregistrement..." : editingSlide ? "Enregistrer les modifications" : "Ajouter le slide"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{heroSlides.length}</p>
                <p className="text-sm text-muted-foreground">Total slides</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSlides}</p>
                <p className="text-sm text-muted-foreground">Slides actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">10s</p>
                <p className="text-sm text-muted-foreground">Intervalle auto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slides List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des slides</CardTitle>
          <CardDescription>
            Les slides actifs défileront automatiquement toutes les 10 secondes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heroSlides.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun slide</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter un slide pour la hero section
              </p>
              <Button onClick={() => setIsSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un slide
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {heroSlides.map((slide) => (
                <div
                  key={slide.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                    slide.isActive ? "bg-card" : "bg-muted/50 opacity-60"
                  )}
                >
                  <div className="shrink-0 text-muted-foreground cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  {/* Preview Image */}
                  <div className="w-32 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                    {slide.image ? (
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${slide.image})` }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{slide.title}</h3>
                      {!slide.isActive && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Masqué</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{slide.subtitle}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {slide.description}
                    </p>
                    {slide.buttonText && (
                      <p className="text-xs text-primary mt-2">
                        Bouton: {slide.buttonText} → {slide.buttonLink}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleHeroSlideActive(slide.id)}
                      title={slide.isActive ? "Masquer" : "Afficher"}
                      className="h-8 w-8"
                    >
                      {slide.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(slide)}
                      className="h-8 w-8 hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(slide)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogTitle className="text-center">
              Voulez-vous supprimer le slide &quot;{slideToDelete?.title}&quot; ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?
              Aucune récupération ne sera possible après validation.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <hr className="my-4" />

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="w-full border border-red-500 bg-transparent text-red-500 hover:bg-red-50"
            >
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
