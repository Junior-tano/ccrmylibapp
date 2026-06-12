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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Pencil,
  Trash2,
  Video as VideoIcon,
  Upload,
  X,
  HelpCircle,
  User,
  Youtube,
} from "lucide-react"
import type { Video } from "@/lib/types"
import { videoCategories } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { fileToBase64 } from "@/lib/image-utils"

const categoryColors: Record<string, string> = {
  msi:             "bg-blue-500/10 text-blue-600 border-blue-500/20",
  jeudi_midi:      "bg-amber-500/10 text-amber-600 border-amber-500/20",
  culte_mercredi:  "bg-purple-500/10 text-purple-600 border-purple-500/20",
  culte_dimanche:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
}

/**
 * Convertit n'importe quel lien YouTube en URL embed propre.
 * Accepte :
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID  (déjà bon)
 *  - https://youtube.com/shorts/VIDEO_ID
 * Retourne null si le lien n'est pas reconnu.
 */
function normalizeYoutubeUrl(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  try {
    const u = new URL(raw)

    // Déjà en format embed → on nettoie juste les params inutiles
    if (u.pathname.startsWith("/embed/")) {
      const id = u.pathname.split("/embed/")[1]?.split("/")[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }

    // youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "").split("?")[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }

    if (u.hostname.includes("youtube.com")) {
      // Shorts
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/)
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`

      // Watch classique
      const videoId = u.searchParams.get("v")
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
  } catch {
    // URL invalide
  }

  return null
}

/** Retourne true si le texte ressemble à un lien YouTube (n'importe quel format) */
function isValidYoutubeInput(input: string): boolean {
  if (!input.trim()) return false
  return (
    input.includes("youtube.com/watch") ||
    input.includes("youtu.be/") ||
    input.includes("youtube.com/embed/") ||
    input.includes("youtube.com/shorts/")
  )
}

export default function AdminVideosPage() {
  const { videos, addVideo, updateVideo, deleteVideo } = useStore()

  const [isSheetOpen, setIsSheetOpen]     = useState(false)
  const [editingVideo, setEditingVideo]   = useState<Video | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title:      "",
    description:"",
    speaker:    "",
    category:   "culte_dimanche" as Video["category"],
    youtubeUrl: "",
    thumbnail:  "",
  })

  const resetForm = () => {
    setFormData({ title:"", description:"", speaker:"", category:"culte_dimanche", youtubeUrl:"", thumbnail:"" })
    setEditingVideo(null)
    setThumbnailFile(null)
  }

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const base64 = await fileToBase64(file)
      setFormData(p => ({ ...p, thumbnail: base64 }))
    }
  }

  // Le lien YouTube est valide s'il est reconnu (n'importe quel format)
  const youtubeInputValid =
    formData.youtubeUrl.trim().length > 0 &&
    isValidYoutubeInput(formData.youtubeUrl)

  const isFormValid =
    formData.title.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    formData.speaker.trim().length > 0 &&
    youtubeInputValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    // On normalise automatiquement le lien YouTube avant sauvegarde
    const embedUrl = normalizeYoutubeUrl(formData.youtubeUrl) ?? formData.youtubeUrl

    const videoData = {
      title:      formData.title,
      description:formData.description,
      speaker:    formData.speaker,
      category:   formData.category,
      youtubeUrl: embedUrl,
      thumbnail:  formData.thumbnail || "/images/video-default.jpg",
      date:       editingVideo?.date ?? new Date().toISOString().split("T")[0],
    }

    if (editingVideo) {
      updateVideo(editingVideo.id, videoData)
    } else {
      addVideo(videoData)
    }
    setIsSheetOpen(false)
    resetForm()
  }

  const handleEdit = (video: Video) => {
    setEditingVideo(video)
    setFormData({
      title:      video.title,
      description:video.description,
      speaker:    video.speaker,
      category:   video.category,
      youtubeUrl: video.youtubeUrl ?? "",
      thumbnail:  video.thumbnail,
    })
    setIsSheetOpen(true)
  }

  const handleDeleteClick   = (video: Video) => { setVideoToDelete(video); setDeleteDialogOpen(true) }
  const handleDeleteConfirm = () => {
    if (videoToDelete) { deleteVideo(videoToDelete.id); setDeleteDialogOpen(false); setVideoToDelete(null) }
  }

  const getCategoryLabel = (v: string) => videoCategories.find(c => c.value === v)?.label ?? v

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Enseignements</h1>
          <p className="text-muted-foreground">Ajoutez et gérez vos enseignements vidéo</p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />Ajouter un enseignement
        </Button>
      </div>

      {/* ── Sheet Formulaire ── */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) resetForm() }}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-xl p-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-start justify-between p-6 border-b bg-background shrink-0">
              <div className="space-y-1 pr-8">
                <SheetTitle className="text-xl font-semibold text-foreground">
                  {editingVideo ? "Modifier la vidéo" : "Ajouter une nouvelle vidéo"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Remplissez les informations et ajoutez le lien YouTube
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsSheetOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <form id="video-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Informations principales */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Informations principales</h3>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Titre de la vidéo <span className="text-destructive">*</span></Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Enseignement du dimanche" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description <span className="text-destructive">*</span></Label>
                    <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Description de la vidéo..." rows={3} className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary resize-none" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="speaker" className="text-sm font-medium">Intervenant <span className="text-destructive">*</span></Label>
                      <Input id="speaker" value={formData.speaker} onChange={e => setFormData({...formData, speaker: e.target.value})}
                        placeholder="Nom de l'intervenant" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">Catégorie <span className="text-destructive">*</span></Label>
                      <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v as Video["category"]})}>
                        <SelectTrigger className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {videoCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Source YouTube */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    <span className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500" />
                      Source Vidéo (YouTube)
                    </span>
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl" className="text-sm font-medium">
                      Lien YouTube <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={e => setFormData({...formData, youtubeUrl: e.target.value})}
                      placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                      className={cn(
                        "bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary",
                        formData.youtubeUrl.trim().length > 0 && !youtubeInputValid && "ring-1 ring-destructive"
                      )}
                      required
                    />
                    {/* Message d'aide dynamique */}
                    {formData.youtubeUrl.trim().length > 0 && !youtubeInputValid ? (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        ⚠ Lien YouTube non reconnu. Vérifiez le format ci-dessous.
                      </p>
                    ) : formData.youtubeUrl.trim().length > 0 && youtubeInputValid ? (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        ✓ Lien YouTube valide — il sera converti automatiquement.
                      </p>
                    ) : null}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Formats acceptés :</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• <span className="font-mono">https://www.youtube.com/watch?v=VIDEO_ID</span></li>
                        <li>• <span className="font-mono">https://youtu.be/VIDEO_ID</span></li>
                        <li>• <span className="font-mono">https://www.youtube.com/embed/VIDEO_ID</span></li>
                        <li>• <span className="font-mono">https://youtube.com/shorts/VIDEO_ID</span></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Miniature */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Miniature</h3>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/30">
                      <Input id="thumbnailFile" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleThumbnailFileChange} className="hidden" />
                      <label htmlFor="thumbnailFile" className="cursor-pointer block">
                        {thumbnailFile ? (
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-14 bg-background rounded-lg overflow-hidden shrink-0 shadow-sm">
                              <img src={URL.createObjectURL(thumbnailFile)} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground">{thumbnailFile.name}</p>
                              <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
                            <p className="text-sm mt-2 text-muted-foreground">Glissez une image ou <span className="text-primary font-medium">parcourir</span></p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Format 16:9 recommandé (1280×720)</p>
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thumbnailUrl" className="text-sm font-medium">Ou entrez une URL</Label>
                      <Input id="thumbnailUrl" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                        placeholder="/images/thumbnail.jpg" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" />
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
                <Button type="submit" form="video-form" disabled={!isFormValid} className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                  {editingVideo ? "Enregistrer les modifications" : "Ajouter la vidéo"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        {videoCategories.map((cat, i) => {
          const colors = ["text-blue-500 bg-blue-500/10","text-amber-500 bg-amber-500/10","text-purple-500 bg-purple-500/10","text-emerald-500 bg-emerald-500/10"]
          return (
            <Card key={cat.value}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors[i].split(" ")[1])}>
                    <VideoIcon className={cn("h-6 w-6", colors[i].split(" ")[0])} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{videos.filter(v => v.category === cat.value).length}</p>
                    <p className="text-sm text-muted-foreground">{cat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Liste ── */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des vidéos</CardTitle>
          <CardDescription>Toutes les vidéos, groupées par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucune vidéo</h3>
              <p className="text-muted-foreground mb-4">Commencez par ajouter une vidéo</p>
              <Button onClick={() => setIsSheetOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter une vidéo</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  {/* Miniature */}
                  <div className="w-24 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${video.thumbnail || "/images/placeholder.jpg"})` }} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn("text-xs", categoryColors[video.category])}>
                        {getCategoryLabel(video.category)}
                      </Badge>
                      {video.youtubeUrl && (
                        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                          <Youtube className="h-3 w-3 mr-1" />YouTube
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-1">{video.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" /><span>{video.speaker}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(video)} className="h-8 w-8 hover:bg-primary/10">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(video)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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
            <AlertDialogTitle className="text-center">Voulez-vous supprimer la vidéo &quot;{videoToDelete?.title}&quot; ?</AlertDialogTitle>
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