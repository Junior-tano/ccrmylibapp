"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { api } from "@/lib/api"
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
  Mic,
  Upload,
  X,
  HelpCircle,
  User,
  Clock,
  Loader2,
} from "lucide-react"
import type { Podcast } from "@/lib/types"
import { podcastThemes } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { uploadAudioFile } from "@/lib/audio-storage"

const themeColors: Record<string, string> = {
  foi:        "bg-blue-500/10 text-blue-600 border-blue-500/20",
  delivrance: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  temoignage: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  priere:     "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

export default function AdminPodcastsPage() {
  const { podcasts, addPodcast, updatePodcast, deletePodcast } = useStore()

  const [isSheetOpen, setIsSheetOpen]           = useState(false)
  const [editingPodcast, setEditingPodcast]      = useState<Podcast | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [podcastToDelete, setPodcastToDelete]   = useState<Podcast | null>(null)

  // Fichiers locaux sélectionnés (avant upload)
  const [audioFile, setAudioFile]   = useState<File | null>(null)
  const [coverFile, setCoverFile]   = useState<File | null>(null)

  // États de chargement pendant l'upload
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isSubmitting, setIsSubmitting]         = useState(false)
  const [uploadError, setUploadError]           = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title:      "",
    description:"",
    speaker:    "",
    duration:   "",
    theme:      "foi" as Podcast["theme"],
    audioUrl:   "",   // URL publique retournée par le backend après upload
    coverImage: "",   // URL publique de la couverture
  })

  const resetForm = () => {
    setFormData({ title:"", description:"", speaker:"", duration:"", theme:"foi", audioUrl:"", coverImage:"" })
    setEditingPodcast(null)
    setAudioFile(null)
    setCoverFile(null)
    setUploadError(null)
    setIsUploadingAudio(false)
    setIsUploadingCover(false)
    setIsSubmitting(false)
  }

  /**
   * Sélection d'un fichier audio :
   * On envoie immédiatement le fichier au backend via multipart/form-data
   * et on stocke l'URL publique retournée dans formData.audioUrl.
   * On extrait également automatiquement la durée du fichier audio.
   *
   * ⚠️  On n'utilise PLUS fileToBase64 pour les audios : un fichier MP3
   *     de 50 Mo donnerait un base64 de ~67 Mo, ce qui dépasse la limite
   *     du localStorage (5-10 Mo) et empêche la persistance dans Zustand.
   */
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAudioFile(file)
    setUploadError(null)
    setIsUploadingAudio(true)

    try {
      // uploadAudioFile tente d'abord le backend Laravel.
      // Si le backend est hors-ligne ou répond 413, il bascule
      // automatiquement sur IndexedDB (stockage local).
      const url = await uploadAudioFile(file)
      setFormData(prev => ({ ...prev, audioUrl: url }))

      // Extraire automatiquement la durée du fichier audio
      // Pour indexeddb://, on doit d'abord convertir en blob://
      const { getAudioBlobUrl: resolveBlobUrl, isLocalAudio } = await import('@/lib/audio-storage')
      const playableUrl = isLocalAudio(url) ? await resolveBlobUrl(url) : url
      const audio = new Audio(playableUrl)
      audio.addEventListener('loadedmetadata', () => {
        const secs = audio.duration
        if (!isNaN(secs) && isFinite(secs)) {
          const minutes = Math.floor(secs / 60)
          const seconds = Math.floor(secs % 60)
          setFormData(prev => ({ ...prev, duration: `${minutes}:${seconds.toString().padStart(2, '0')}` }))
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'upload audio"
      setUploadError(`Audio : ${message}`)
      setAudioFile(null)
    } finally {
      setIsUploadingAudio(false)
    }
  }

  /**
   * Sélection d'une image de couverture :
   * Même logique : upload immédiat vers le backend.
   */
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverFile(file)
    setUploadError(null)
    setIsUploadingCover(true)

    try {
      const { url } = await api.uploadImage(file)
      setFormData(prev => ({ ...prev, coverImage: url }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'upload de l'image"
      setUploadError(`Image : ${message}`)
      setCoverFile(null)
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.speaker) return
    if (isUploadingAudio || isUploadingCover) return  // upload en cours

    setIsSubmitting(true)
    setUploadError(null)

    try {
      const podcastData = {
        title:      formData.title,
        description:formData.description,
        speaker:    formData.speaker,
        duration:   formData.duration,
        theme:      formData.theme,
        audioUrl:   formData.audioUrl,
        coverImage: formData.coverImage || "/images/podcast-default.jpg",
        date:       editingPodcast?.date ?? new Date().toISOString().split("T")[0],
      }

      if (editingPodcast) {
        await updatePodcast(editingPodcast.id, podcastData)
      } else {
        await addPodcast(podcastData)
      }
      setIsSheetOpen(false)
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      setUploadError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (podcast: Podcast) => {
    setEditingPodcast(podcast)
    setFormData({
      title:      podcast.title,
      description:podcast.description,
      speaker:    podcast.speaker,
      duration:   podcast.duration,
      theme:      podcast.theme,
      audioUrl:   podcast.audioUrl,
      coverImage: podcast.coverImage ?? "",
    })
    setIsSheetOpen(true)
  }

  const handleDeleteClick   = (podcast: Podcast) => { setPodcastToDelete(podcast); setDeleteDialogOpen(true) }
  const handleDeleteConfirm = () => {
    if (podcastToDelete) { deletePodcast(podcastToDelete.id); setDeleteDialogOpen(false); setPodcastToDelete(null) }
  }

  const getThemeLabel = (v: string) => podcastThemes.find(t => t.value === v)?.label ?? v

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Podcasts</h1>
          <p className="text-muted-foreground">Ajoutez et gérez vos contenus audio</p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />Ajouter un podcast
        </Button>
      </div>

      {/* ── Sheet Formulaire ── */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) resetForm() }}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-xl p-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-start justify-between p-6 border-b bg-background shrink-0">
              <div className="space-y-1 pr-8">
                <SheetTitle className="text-xl font-semibold text-foreground">
                  {editingPodcast ? "Modifier le podcast" : "Ajouter un nouveau podcast"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Remplissez les informations du podcast et téléchargez le fichier audio
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsSheetOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <form id="podcast-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Message d'erreur global */}
                {uploadError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                    {uploadError}
                  </div>
                )}

                {/* Informations principales */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Informations principales</h3>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Titre du podcast <span className="text-destructive">*</span></Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: La prière efficace" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description <span className="text-destructive">*</span></Label>
                    <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Description du podcast..." rows={3} className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary resize-none" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="speaker" className="text-sm font-medium">Orateur <span className="text-destructive">*</span></Label>
                      <Input id="speaker" value={formData.speaker} onChange={e => setFormData({...formData, speaker: e.target.value})}
                        placeholder="Nom de l'orateur" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-1.5">
                        Durée
                        {formData.audioUrl && formData.duration && (
                          <span className="text-[10px] font-normal text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">auto ✓</span>
                        )}
                      </Label>
                      <Input id="duration" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}
                        placeholder="Rempli automatiquement au chargement" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme" className="text-sm font-medium">Thème <span className="text-destructive">*</span></Label>
                    <Select value={formData.theme} onValueChange={v => setFormData({...formData, theme: v as Podcast["theme"]})}>
                      <SelectTrigger className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {podcastThemes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Image de couverture */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Image de couverture</h3>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/30">
                      <Input id="coverFile" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleCoverFileChange} className="hidden" disabled={isUploadingCover} />
                      <label htmlFor="coverFile" className={cn("cursor-pointer block", isUploadingCover && "opacity-60 cursor-not-allowed")}>
                        {isUploadingCover ? (
                          <div className="py-4 flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Upload de l&apos;image en cours...</p>
                          </div>
                        ) : coverFile && formData.coverImage ? (
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-background rounded-lg overflow-hidden shrink-0 shadow-sm">
                              <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
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
                        placeholder="/images/podcast-cover.jpg" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>
                  </div>
                </div>

                {/* Fichier Audio */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Fichier Audio</h3>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/30">
                      <Input id="audioFile" type="file" accept=".mp3,.wav,.m4a,.ogg" onChange={handleAudioFileChange} className="hidden" disabled={isUploadingAudio} />
                      <label htmlFor="audioFile" className={cn("cursor-pointer block", isUploadingAudio && "opacity-60 cursor-not-allowed")}>
                        {isUploadingAudio ? (
                          <div className="py-4 flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Upload du fichier audio en cours...</p>
                            <p className="text-xs text-muted-foreground/70">Cela peut prendre quelques secondes selon la taille</p>
                          </div>
                        ) : audioFile && formData.audioUrl ? (
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                              <Mic className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground">{audioFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(2)} MB · Uploadé ✓</p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
                            <p className="text-sm mt-2 text-muted-foreground">Glissez le fichier audio ou <span className="text-primary font-medium">parcourir</span></p>
                            <p className="text-xs text-muted-foreground/70 mt-1">MP3, WAV, M4A, OGG (max 200MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="audioUrl" className="text-sm font-medium">Ou entrez une URL</Label>
                      <Input id="audioUrl" value={formData.audioUrl} onChange={e => setFormData({...formData, audioUrl: e.target.value})}
                        placeholder="https://example.com/audio.mp3" className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>

                    {/* Aperçu audio si une URL est disponible */}
                    {formData.audioUrl && !formData.audioUrl.startsWith("data:") && !formData.audioUrl.startsWith("indexeddb://") && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Aperçu audio :</p>
                        <audio controls className="w-full h-8" src={formData.audioUrl}>
                          Votre navigateur ne supporte pas l&apos;élément audio.
                        </audio>
                      </div>
                    )}
                    {formData.audioUrl && formData.audioUrl.startsWith("indexeddb://") && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-xs text-green-600">
                          Fichier audio sauvegardé. Il sera lisible sur le frontoffice de ce navigateur.
                        </p>
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
                <Button
                  type="submit"
                  form="podcast-form"
                  className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white px-6"
                  disabled={isUploadingAudio || isUploadingCover || isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</>
                  ) : isUploadingAudio || isUploadingCover ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upload en cours...</>
                  ) : editingPodcast ? "Enregistrer les modifications" : "Ajouter le podcast"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{podcasts.length}</p>
                <p className="text-sm text-muted-foreground">Total podcasts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {podcastThemes.map((theme) => {
          const colorMap: Record<string, { bg: string; icon: string }> = {
            foi:        { bg: 'bg-blue-500/10',    icon: 'text-blue-500'    },
            delivrance: { bg: 'bg-purple-500/10',  icon: 'text-purple-500'  },
            temoignage: { bg: 'bg-amber-500/10',   icon: 'text-amber-500'   },
            priere:     { bg: 'bg-rose-500/10',    icon: 'text-rose-500'    },
          }
          const colors = colorMap[theme.value] ?? { bg: 'bg-primary/10', icon: 'text-primary' }
          return (
            <Card key={theme.value}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg)}>
                    <Mic className={cn('h-6 w-6', colors.icon)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {podcasts.filter(p => p.theme === theme.value).length}
                    </p>
                    <p className="text-sm text-muted-foreground">{theme.label}</p>
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
          <CardTitle>Liste des podcasts</CardTitle>
          <CardDescription>Tous les podcasts disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          {podcasts.length === 0 ? (
            <div className="text-center py-12">
              <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun podcast</h3>
              <p className="text-muted-foreground mb-4">Commencez par ajouter un podcast</p>
              <Button onClick={() => setIsSheetOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter un podcast</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {podcasts.map((podcast) => (
                <div key={podcast.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${podcast.coverImage || "/images/placeholder.jpg"})` }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn("text-xs", themeColors[podcast.theme])}>
                        {getThemeLabel(podcast.theme)}
                      </Badge>
                      {/* Indicateur d'audio disponible */}
                      {podcast.audioUrl && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                          Audio ✓
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-1">{podcast.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><User className="h-3 w-3" /><span>{podcast.speaker}</span></div>
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{podcast.duration}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(podcast)} className="h-8 w-8 hover:bg-primary/10">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(podcast)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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
            <AlertDialogTitle className="text-center">Voulez-vous supprimer le podcast &quot;{podcastToDelete?.title}&quot; ?</AlertDialogTitle>
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