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
  Calendar,
  Clock,
  MapPin,
  User,
  Church,
  Users,
  BookOpen,
  Megaphone,
  Heart,
  Star,
  X,
  HelpCircle,
  Upload
} from "lucide-react"
import type { UpcomingProgram } from "@/lib/types"
import { programCategories } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { fileToBase64 } from "@/lib/image-utils"

const categoryIcons: Record<string, React.ElementType> = {
  culte: Church,
  conference: Megaphone,
  seminaire: BookOpen,
  evangelisation: Heart,
  jeunesse: Users,
  autre: Star
}

const categoryColors: Record<string, string> = {
  culte: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  conference: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  seminaire: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  evangelisation: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  jeunesse: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  autre: "bg-gray-500/10 text-gray-600 border-gray-500/20"
}

export default function AdminProgramsPage() {
  const { upcomingPrograms, addUpcomingProgram, updateUpcomingProgram, deleteUpcomingProgram } = useStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<UpcomingProgram | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<UpcomingProgram | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    image: "",
    speaker: "",
    category: "culte" as UpcomingProgram['category']
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      image: "",
      speaker: "",
      category: "culte"
    })
    setEditingProgram(null)
    setCoverFile(null)
  }

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const base64 = await fileToBase64(file)
      setFormData(prev => ({ ...prev, image: base64 }))
    }
  }

  const isFormValid =
    formData.title.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    formData.date.trim().length > 0 &&
    formData.time.trim().length > 0 &&
    formData.location.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    const programData = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      image: formData.image || '/images/program-default.jpg',
      speaker: formData.speaker || undefined,
      category: formData.category
    }

    if (editingProgram) {
      updateUpcomingProgram(editingProgram.id, programData)
    } else {
      addUpcomingProgram(programData)
    }

    setIsSheetOpen(false)
    resetForm()
  }

  const handleEdit = (program: UpcomingProgram) => {
    setEditingProgram(program)
    setFormData({
      title: program.title,
      description: program.description,
      date: program.date,
      time: program.time,
      location: program.location,
      image: program.image,
      speaker: program.speaker || "",
      category: program.category
    })
    setIsSheetOpen(true)
  }

  const handleDeleteClick = (program: UpcomingProgram) => {
    setProgramToDelete(program)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (programToDelete) {
      deleteUpcomingProgram(programToDelete.id)
      setDeleteDialogOpen(false)
      setProgramToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const sortedPrograms = [...upcomingPrograms].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programmes à venir</h1>
          <p className="text-muted-foreground">
            Gérez les événements et programmes de l&apos;église
          </p>
        </div>
        <Button
          onClick={() => setIsSheetOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un programme
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
                  {editingProgram ? "Modifier le programme" : "Ajouter un nouveau programme"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Remplissez les informations de l&apos;événement à venir
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
              <form id="program-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Section: Informations principales */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Informations principales
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Titre du programme <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Conférence de Réveillage Spirituel"
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Décrivez l'événement..."
                      rows={3}
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Catégorie <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value as UpcomingProgram['category']})}
                    >
                      <SelectTrigger className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {programCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Section: Date, Heure & Lieu */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Date, Heure &amp; Lieu
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium">
                        Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-sm font-medium">
                        Heure <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">
                      Lieu <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Temple Principal CCR, Cotonou"
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="speaker" className="text-sm font-medium">
                      Orateur (optionnel)
                    </Label>
                    <Input
                      id="speaker"
                      value={formData.speaker}
                      onChange={(e) => setFormData({...formData, speaker: e.target.value})}
                      placeholder="Pasteur Jean-Marc"
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Section: Image */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Image de l&apos;événement
                  </h3>

                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/30">
                      <Input
                        id="coverFile"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleCoverFileChange}
                        className="hidden"
                      />
                      <label htmlFor="coverFile" className="cursor-pointer block">
                        {coverFile ? (
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-20 bg-background rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              <img
                                src={URL.createObjectURL(coverFile)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground">{coverFile.name}</p>
                              <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
                            <p className="text-sm mt-2 text-muted-foreground">
                              Glissez une image ou <span className="text-primary font-medium">parcourir</span>
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP (max 5MB)</p>
                          </div>
                        )}
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
                        placeholder="/images/conference-1.jpg"
                        className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

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
                  form="program-form"
                  disabled={!isFormValid}
                  className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingProgram ? "Enregistrer les modifications" : "Ajouter le programme"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Stats — générées dynamiquement depuis programCategories */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Carte Total */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingPrograms.length}</p>
                <p className="text-sm text-muted-foreground">Total programmes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Une carte par catégorie */}
        {programCategories.map((cat) => {
          const Icon = categoryIcons[cat.value] ?? Star
          const colorMap: Record<string, { bg: string; icon: string }> = {
            culte:          { bg: 'bg-blue-500/10',    icon: 'text-blue-500'    },
            conference:     { bg: 'bg-purple-500/10',  icon: 'text-purple-500'  },
            seminaire:      { bg: 'bg-amber-500/10',   icon: 'text-amber-500'   },
            evangelisation: { bg: 'bg-rose-500/10',    icon: 'text-rose-500'    },
            jeunesse:       { bg: 'bg-emerald-500/10', icon: 'text-emerald-500' },
            autre:          { bg: 'bg-gray-500/10',    icon: 'text-gray-500'    },
          }
          const colors = colorMap[cat.value] ?? { bg: 'bg-primary/10', icon: 'text-primary' }
          return (
            <Card key={cat.value}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg)}>
                    <Icon className={cn('h-6 w-6', colors.icon)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {upcomingPrograms.filter(p => p.category === cat.value).length}
                    </p>
                    <p className="text-sm text-muted-foreground">{cat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des programmes</CardTitle>
          <CardDescription>
            Tous les programmes à venir, triés par date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPrograms.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun programme</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter un programme à venir
              </p>
              <Button onClick={() => setIsSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un programme
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPrograms.map((program) => {
                const CategoryIcon = categoryIcons[program.category]
                const categoryLabel = programCategories.find(c => c.value === program.category)?.label
                
                return (
                  <div
                    key={program.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    {/* Preview Image */}
                    <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden shrink-0">
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${program.image || '/images/placeholder.jpg'})` }}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", categoryColors[program.category])}
                        >
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {categoryLabel}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-1">{program.title}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="truncate">{formatDate(program.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{program.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{program.location}</span>
                        </div>
                        {program.speaker && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{program.speaker}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(program)}
                        className="h-8 w-8 hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(program)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
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
              Voulez-vous supprimer le programme &quot;{programToDelete?.title}&quot; ?
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
