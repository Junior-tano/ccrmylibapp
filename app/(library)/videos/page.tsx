"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoCard } from "@/components/library/video-card"
import { useStore } from "@/lib/store"
import { videoCategories } from "@/lib/mock-data"
import { Search, Video, PlayCircle, Calendar, Users } from "lucide-react"

export default function VideosPage() {
  const videos = useStore((state) => state.videos)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = activeCategory === "all" || video.category === activeCategory
    
    return matchesSearch && matchesCategory
  })

  // Group videos by category
  const videosByCategory = videoCategories.reduce((acc, cat) => {
    acc[cat.value] = videos.filter(v => v.category === cat.value)
    return acc
  }, {} as Record<string, typeof videos>)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'msi':
        return <Users className="h-4 w-4" />
      case 'jeudi_midi':
        return <Calendar className="h-4 w-4" />
      case 'culte_mercredi':
        return <PlayCircle className="h-4 w-4" />
      case 'culte_dimanche':
        return <PlayCircle className="h-4 w-4" />
      default:
        return <Video className="h-4 w-4" />
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'msi':
        return 'Enseignements et formations MSI pour approfondir votre connaissance de la Parole'
      case 'jeudi_midi':
        return 'Retrouvez nos cultes du jeudi midi pour un moment de ressourcement'
      case 'culte_mercredi':
        return 'Les messages et predications du culte du mercredi'
      case 'culte_dimanche':
        return 'Les predications et moments forts du culte dominical'
      default:
        return 'Enseignements video'
    }
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Enseignements</h1>
              <p className="text-muted-foreground">Predications, formations et messages edifiants</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {videoCategories.map((cat) => (
              <div 
                key={cat.value}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveCategory(cat.value)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {getCategoryIcon(cat.value)}
                  </div>
                  <span className="font-semibold text-foreground">{cat.label}</span>
                </div>
                <p className="text-2xl font-bold text-primary">{videosByCategory[cat.value]?.length || 0}</p>
                <p className="text-xs text-muted-foreground">videos disponibles</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre, intervenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-full sm:w-56 bg-card">
              <SelectValue placeholder="Filtrer par categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les categories</SelectItem>
              {videoCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="all" 
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Tous
            </TabsTrigger>
            {videoCategories.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All Videos Tab */}
          <TabsContent value="all" className="mt-0">
            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-6">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} trouvee{filteredVideos.length !== 1 ? 's' : ''}
            </p>

            {/* Videos by Category */}
            {videoCategories.map((cat) => {
              const categoryVideos = filteredVideos.filter(v => v.category === cat.value)
              if (categoryVideos.length === 0) return null
              
              return (
                <div key={cat.value} className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        {getCategoryIcon(cat.value)}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{cat.label}</h2>
                        <p className="text-sm text-muted-foreground">{getCategoryDescription(cat.value)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveCategory(cat.value)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Voir tout
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {categoryVideos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                </div>
              )
            })}

            {filteredVideos.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Aucune video trouvee</h3>
                <p className="text-muted-foreground">
                  Essayez de modifier vos criteres de recherche
                </p>
              </div>
            )}
          </TabsContent>

          {/* Category-specific Tabs */}
          {videoCategories.map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="mt-0">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    {getCategoryIcon(cat.value)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{cat.label}</h2>
                    <p className="text-muted-foreground">{getCategoryDescription(cat.value)}</p>
                  </div>
                </div>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground mb-6">
                {videosByCategory[cat.value]?.length || 0} video{(videosByCategory[cat.value]?.length || 0) !== 1 ? 's' : ''} dans cette categorie
              </p>

              {/* Videos Grid */}
              {videosByCategory[cat.value]?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {videosByCategory[cat.value].map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Aucune video dans cette categorie</h3>
                  <p className="text-muted-foreground">
                    Les videos de {cat.label} seront bientot disponibles
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
