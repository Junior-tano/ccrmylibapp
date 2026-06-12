"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Podcast } from "@/lib/types"
import { Download, Share2, Mic, Play, Pause, Volume2, VolumeX, X, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuthModal } from "@/components/library/auth-modal"
import { getAudioBlobUrl, isLocalAudio } from "@/lib/audio-storage"

interface PodcastCardProps {
  podcast: Podcast
}

export function PodcastCard({ podcast }: PodcastCardProps) {
  const { toast } = useToast()
  const { requireAuth } = useAuthModal()
  const [showPlayer, setShowPlayer] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isDragging, setIsDragging] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const [resolvedUrl, setResolvedUrl] = useState<string>("")
  const [isResolvingUrl, setIsResolvingUrl] = useState(false)

  useEffect(() => {
    if (!showPlayer || !podcast.audioUrl) return
    setCurrentTime(0)
    setDuration(0)

    if (isLocalAudio(podcast.audioUrl)) {
      setIsResolvingUrl(true)
      getAudioBlobUrl(podcast.audioUrl)
        .then((blobUrl) => setResolvedUrl(blobUrl))
        .catch(() => {
          toast({ title: "Fichier audio introuvable", description: "Le fichier audio local n'a pas pu être chargé.", variant: "destructive" })
          setResolvedUrl("")
        })
        .finally(() => setIsResolvingUrl(false))
    } else {
      setResolvedUrl(podcast.audioUrl)
    }
  }, [showPlayer, podcast.audioUrl, toast])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !resolvedUrl) return

    const onTimeUpdate   = () => { if (!isDragging) setCurrentTime(audio.currentTime) }
    const onDuration     = () => { if (!isNaN(audio.duration) && isFinite(audio.duration)) setDuration(audio.duration) }
    const onEnded        = () => { setIsPlaying(false); setCurrentTime(0) }
    const onPlay         = () => setIsPlaying(true)
    const onPause        = () => setIsPlaying(false)
    const onError        = () => {
      toast({ title: "Erreur de lecture", description: "Impossible de lire ce fichier audio.", variant: "destructive" })
      setIsPlaying(false)
    }

    audio.addEventListener("timeupdate",    onTimeUpdate)
    audio.addEventListener("loadedmetadata",onDuration)
    audio.addEventListener("durationchange",onDuration)
    audio.addEventListener("ended",         onEnded)
    audio.addEventListener("play",          onPlay)
    audio.addEventListener("pause",         onPause)
    audio.addEventListener("error",         onError)

    if (!isNaN(audio.duration) && isFinite(audio.duration)) setDuration(audio.duration)

    return () => {
      audio.removeEventListener("timeupdate",    onTimeUpdate)
      audio.removeEventListener("loadedmetadata",onDuration)
      audio.removeEventListener("durationchange",onDuration)
      audio.removeEventListener("ended",         onEnded)
      audio.removeEventListener("play",          onPlay)
      audio.removeEventListener("pause",         onPause)
      audio.removeEventListener("error",         onError)
    }
  }, [resolvedUrl, isDragging, toast])

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "00:00"
    const t = Math.floor(secs)
    const h = Math.floor(t / 3600)
    const m = Math.floor((t % 3600) / 60)
    const s = t % 60
    const mm = String(m).padStart(2, "0")
    const ss = String(s).padStart(2, "0")
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
  }

  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0

  // Seek en cliquant/glissant directement sur la barre
  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const track = trackRef.current
    const audio = audioRef.current
    if (!track || !audio || !duration) return
    const rect = track.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = ratio * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !resolvedUrl) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {
        toast({ title: "Erreur de lecture", description: "Vérifiez que le serveur backend est démarré.", variant: "destructive" })
      })
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isMuted) {
      audio.volume = volume || 0.7
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: podcast.title, text: podcast.description, url: window.location.href }) } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({ title: "Lien copié", description: "Le lien a été copié dans le presse-papier" })
    }
  }

  const handleListenClick = () => requireAuth(() => setShowPlayer(true))

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!localStorage.getItem("user")) {
      e.preventDefault()
      requireAuth(() => {
        const link = document.createElement("a")
        link.href = resolvedUrl || podcast.audioUrl
        link.download = `${podcast.title}.mp3`
        link.click()
      })
    }
  }

  const handleClosePlayer = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
    setShowPlayer(false)
    setResolvedUrl("")
    setCurrentTime(0)
    setDuration(0)
  }

  return (
    <Card className="overflow-hidden group">
      {/* ── Pochette ── */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10">
        {podcast.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={podcast.coverImage}
            alt={podcast.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mic className="h-12 w-12 text-primary/25" />
          </div>
        )}

        {/* Overlay + bouton play au centre — visible au survol si player fermé */}
        {!showPlayer && podcast.audioUrl && (
          <button
            onClick={handleListenClick}
            aria-label="Écouter"
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            )}
          >
            <span className="h-11 w-11 rounded-full bg-white/20 border border-white/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-5 w-5 text-white ml-0.5" />
            </span>
          </button>
        )}
      </div>

      {/* ── Infos ── */}
      <div className="px-3 pt-2.5 pb-1">
        <h3 className="font-medium text-sm leading-tight line-clamp-1 text-foreground">{podcast.title}</h3>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-primary truncate">{podcast.speaker}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
            <Clock className="h-2.5 w-2.5" />
            {podcast.duration || "—"}
          </p>
        </div>
      </div>

      {/* ── Lecteur intégré ── */}
      {showPlayer && (
        <div className="mx-2 mb-2 mt-1 rounded-xl overflow-hidden border border-border/60 bg-muted/40">
          <audio ref={audioRef} src={resolvedUrl} preload="metadata" />

          {isResolvingUrl ? (
            <div className="flex items-center justify-center gap-2 py-3 px-3 text-xs text-muted-foreground">
              <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
              Chargement…
            </div>
          ) : resolvedUrl ? (
            <div className="px-3 pt-3 pb-2.5 space-y-2">

              {/* ── Barre de progression ── */}
              <div
                ref={trackRef}
                className="relative h-5 flex items-center cursor-pointer select-none group/track"
                onMouseDown={(e) => { setIsDragging(true); seekFromEvent(e) }}
                onMouseMove={(e) => { if (isDragging) seekFromEvent(e) }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onTouchStart={(e) => { setIsDragging(true); seekFromEvent(e) }}
                onTouchMove={(e) => { if (isDragging) seekFromEvent(e) }}
                onTouchEnd={() => setIsDragging(false)}
              >
                {/* Track fond */}
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-border/70 top-1/2 -translate-y-1/2" />
                {/* Track remplie */}
                <div
                  className="absolute left-0 h-1.5 rounded-full bg-primary top-1/2 -translate-y-1/2 transition-[width] duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Thumb */}
                <div
                  className={cn(
                    "absolute h-3.5 w-3.5 rounded-full bg-primary top-1/2 -translate-y-1/2 -translate-x-1/2",
                    "shadow-sm ring-2 ring-primary/20 transition-transform",
                    "opacity-0 group-hover/track:opacity-100",
                    isDragging && "opacity-100 scale-125"
                  )}
                  style={{ left: `${progressPercent}%` }}
                />
              </div>

              {/* ── Temps : 00:00 ──────────── 06:12 ── */}
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[10px] tabular-nums font-medium text-primary">
                  {formatTime(currentTime)}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {formatTime(duration)}
                </span>
              </div>

              {/* ── Contrôles ── */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1">
                  {/* Mute */}
                  <button
                    onClick={toggleMute}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    {isMuted
                      ? <VolumeX className="h-3.5 w-3.5" />
                      : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Play / Pause — centré */}
                <button
                  onClick={togglePlay}
                  className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                  aria-label={isPlaying ? "Pause" : "Lecture"}
                >
                  {isPlaying
                    ? <Pause className="h-4 w-4" />
                    : <Play  className="h-4 w-4 ml-0.5" />}
                </button>

                {/* Fermer */}
                <button
                  onClick={handleClosePlayer}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Fermer le lecteur"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2.5">
              <p className="text-xs text-destructive">Fichier audio non disponible</p>
              <button onClick={handleClosePlayer} className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="px-2 pb-2.5 flex flex-col gap-1.5">
        {!showPlayer && (
          <Button
            size="sm"
            className="w-full h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            onClick={handleListenClick}
            disabled={!podcast.audioUrl}
          >
            <Play className="h-3 w-3 mr-1.5" />
            {podcast.audioUrl ? "Écouter" : "Aucun audio"}
          </Button>
        )}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs"
            onClick={handleShare}
          >
            <Share2 className="h-3 w-3 mr-1" />
            Partager
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" asChild>
            <a href={resolvedUrl || podcast.audioUrl} download onClick={handleDownloadClick}>
              <Download className="h-3 w-3 mr-1" />
              Télécharger
            </a>
          </Button>
        </div>
      </div>
    </Card>
  )
}