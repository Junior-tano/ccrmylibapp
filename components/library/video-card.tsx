"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Video } from "@/lib/types"
import { Play, Share2, Video as VideoIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthModal } from "@/components/library/auth-modal"

interface VideoCardProps {
  video: Video
}

/**
 * Convertit n'importe quel lien YouTube en URL embed valide.
 */
function getEmbedUrl(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.pathname.startsWith("/embed/")) {
      const base = `${u.origin}${u.pathname}`
      return `${base}?enablejsapi=1&rel=0`
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "")
      if (id) return `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`
    }
    if (u.hostname.includes("youtube.com")) {
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/)
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?enablejsapi=1&rel=0`
      const videoId = u.searchParams.get("v")
      if (videoId) return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`
    }
  } catch { /* URL invalide */ }
  return null
}

/* ─── Confettis ────────────────────────────────────────────────────────────── */

interface Confetti {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  shape: "rect" | "circle" | "triangle"
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

const COLORS = [
  "#E07A5F", "#F2CC8F", "#81B29A", "#3D405B",
  "#F4F1DE", "#FFBE0B", "#FB5607", "#FF006E",
  "#8338EC", "#3A86FF", "#06D6A0",
]

function createConfetti(id: number, width: number): Confetti {
  return {
    id,
    x: Math.random() * width,
    y: -20 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 2.5,
    vy: 1.5 + Math.random() * 2.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: (["rect", "circle", "triangle"] as const)[Math.floor(Math.random() * 3)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 6,
    opacity: 0.85 + Math.random() * 0.15,
  }
}

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Confetti[]>([])
  const frameRef  = useRef<number>(0)
  const counterRef = useRef(0)

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(frameRef.current)
      particles.current = []
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const draw = (p: Confetti) => {
      ctx.save()
      ctx.globalAlpha = p.opacity
      ctx.fillStyle   = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)

      if (p.shape === "circle") {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.shape === "triangle") {
        ctx.beginPath()
        ctx.moveTo(0, -p.size / 2)
        ctx.lineTo(p.size / 2, p.size / 2)
        ctx.lineTo(-p.size / 2, p.size / 2)
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      }
      ctx.restore()
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Spawn de nouveaux confettis en continu (~4 par frame)
      for (let i = 0; i < 4; i++) {
        particles.current.push(createConfetti(counterRef.current++, canvas.width))
      }

      // Mise à jour et dessin
      particles.current = particles.current.filter(p => {
        p.x        += p.vx
        p.y        += p.vy
        p.rotation += p.rotationSpeed
        // légère dérive horizontale sinusoïdale
        p.vx       += Math.sin(p.y / 30) * 0.05
        draw(p)
        return p.y < canvas.height + 30
      })

      frameRef.current = requestAnimationFrame(loop)
    }

    loop()
    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  )
}

/* ─── VideoCard ─────────────────────────────────────────────────────────────── */

export function VideoCard({ video }: VideoCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast }           = useToast()
  const { requireAuth }     = useAuthModal()

  const embedUrl = getEmbedUrl(video.youtubeUrl ?? "")

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, text: video.description, url: window.location.href })
      } catch { /* annulé */ }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({ title: "Lien copié", description: "Le lien a été copié dans le presse-papier" })
    }
  }

  const handlePlay      = (e: React.MouseEvent) => { e.stopPropagation(); requireAuth(() => setIsOpen(true)) }
  const handleCardClick = () => requireAuth(() => setIsOpen(true))

  return (
    <>
      <Card className="overflow-hidden">
        <div
          className="aspect-square bg-gradient-to-br from-secondary/20 to-secondary/5 relative group cursor-pointer"
          onClick={handleCardClick}
        >
          {video.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { ;(e.target as HTMLImageElement).style.display = "none" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoIcon className="h-12 w-12 text-secondary/30" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
            </div>
          </div>
        </div>

        <CardContent className="p-3 space-y-2">
          <div>
            <h3 className="font-medium text-sm leading-tight line-clamp-1">{video.title}</h3>
            <p className="text-xs text-primary">{video.speaker}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              variant="default"
              size="sm"
              className="w-full h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3 mr-1.5" />
              Partager
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={handlePlay}
            >
              <Play className="h-3 w-3 mr-1.5" />
              Regarder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog lecteur vidéo ── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{video.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* Lecteur vidéo */}
            <div className="aspect-video bg-foreground/5 rounded-lg overflow-hidden">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <VideoIcon className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-sm">Vidéo non disponible</p>
                  {video.youtubeUrl && (
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline mt-1"
                    >
                      Ouvrir sur YouTube
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Description encadrée — même couleur que le bouton Partager */}
            <div
              className="relative overflow-hidden flex items-center gap-3 px-5 py-3 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                boxShadow: "0 4px 12px color-mix(in oklch, var(--primary) 40%, transparent)",
              }}
            >              {/* Confettis uniquement sur ce bloc */}
              <ConfettiCanvas active={isOpen} />

              {/* Icône décorative */}
              <span className="relative z-10 shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <p
                className="relative z-10 leading-snug text-base font-bold"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.45), 0 0px 2px rgba(0,0,0,0.3)" }}
              >
                {video.description}
              </p>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}