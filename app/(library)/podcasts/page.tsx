"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PodcastCard } from "@/components/library/podcast-card"
import { useStore } from "@/lib/store"
import { podcastThemes } from "@/lib/mock-data"
import { Search, Mic } from "lucide-react"

export default function PodcastsPage() {
  const podcasts = useStore((state) => state.podcasts)
  const [searchQuery, setSearchQuery] = useState("")
  const [themeFilter, setThemeFilter] = useState<string>("all")

  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch = 
      podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTheme = themeFilter === "all" || podcast.theme === themeFilter
    
    return matchesSearch && matchesTheme
  })

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Podcasts</h1>
              <p className="text-muted-foreground">Enseignements et temoignages audio</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre, orateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={themeFilter} onValueChange={setThemeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les themes</SelectItem>
              {podcastThemes.map(theme => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          {filteredPodcasts.length} podcast{filteredPodcasts.length !== 1 ? 's' : ''} trouve{filteredPodcasts.length !== 1 ? 's' : ''}
        </p>

        {/* Podcasts Grid */}
        {filteredPodcasts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredPodcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Mic className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun podcast trouve</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos criteres de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
