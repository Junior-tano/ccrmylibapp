"use client"

import { useState, useEffect, useCallback } from "react"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Church,
  Users,
  BookOpen,
  Megaphone,
  Heart,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

const categoryIcons: Record<string, React.ElementType> = {
  culte: Church,
  conference: Megaphone,
  seminaire: BookOpen,
  evangelisation: Heart,
  jeunesse: Users,
  autre: Star
}

const categoryLabels: Record<string, string> = {
  culte: "Culte",
  conference: "Conférence",
  seminaire: "Séminaire",
  evangelisation: "Évangélisation",
  jeunesse: "Jeunesse",
  autre: "Autre"
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function useCountdown(targetDate: string): TimeLeft | null {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    const calculate = () => {
      const target = new Date(targetDate).getTime()
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }

    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

function CountdownDisplay({ dateString }: { dateString: string }) {
  const timeLeft = useCountdown(dateString)

  if (!timeLeft) return null

  const units = [
    { label: "JOURS", value: timeLeft.days },
    { label: "HEURES", value: timeLeft.hours },
    { label: "MINUTES", value: timeLeft.minutes },
    { label: "SECONDES", value: timeLeft.seconds },
  ]

  const isOver = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0
  
  if (isOver) {
    return (
      <div className="flex items-center justify-center gap-3 mt-6">
        <span className="text-white/80 text-lg font-medium tracking-widest uppercase">Événement en cours</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-4 md:gap-8 mt-6">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-4xl md:text-6xl font-black text-[#e8732a] tabular-nums leading-none">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[10px] md:text-xs font-semibold text-white/50 tracking-[0.2em] mt-1">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function UpcomingProgramsPage() {
  const { upcomingPrograms } = useStore()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  
  const sortedPrograms = [...upcomingPrograms].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % sortedPrograms.length)
  }, [sortedPrograms.length])
  
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + sortedPrograms.length) % sortedPrograms.length)
  }, [sortedPrograms.length])
  
  useEffect(() => {
    if (!isAutoPlaying || sortedPrograms.length <= 1) return
    const interval = setInterval(nextSlide, 10000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide, sortedPrograms.length])
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toUpperCase()
  }
  
  if (sortedPrograms.length === 0) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f0c0c 0%, #1a1010 50%, #0a0a0a 100%)" }}
      >
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #e8732a 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />
        <div className="relative text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-[#e8732a]/30 flex items-center justify-center">
            <Calendar className="h-9 w-9 text-[#e8732a]/60" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Aucun programme à venir</h1>
          <p className="text-white/50 leading-relaxed">
            Revenez bientôt pour découvrir nos prochains événements.
          </p>
        </div>
      </div>
    )
  }
  
  const currentProgram = sortedPrograms[currentSlide]
  const CategoryIcon = categoryIcons[currentProgram.category]

  return (
    <div className="min-h-screen">
      {/* HERO — Conference-style full-screen */}
      <section 
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Background image */}
        {currentProgram.image && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{ backgroundImage: `url(${currentProgram.image})` }}
          />
        )}
        
        {/* Dark overlay with brand gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: currentProgram.image
              ? "linear-gradient(to bottom, rgba(10,5,5,0.75) 0%, rgba(10,5,5,0.65) 50%, rgba(10,5,5,0.85) 100%)"
              : "linear-gradient(135deg, #0f0c0c 0%, #1a1010 50%, #0a0a0a 100%)"
          }}
        />

        {/* Dot grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #e8732a 1px, transparent 0)",
          backgroundSize: "32px 32px"
        }} />

        {/* Decorative shapes */}
        <div className="absolute top-20 left-8 w-0 h-0 opacity-40" style={{
          borderLeft: "30px solid transparent",
          borderRight: "30px solid transparent",
          borderBottom: "52px solid #e8732a"
        }} />
        <div className="absolute bottom-28 right-10 w-0 h-0 opacity-20" style={{
          borderLeft: "18px solid transparent",
          borderRight: "18px solid transparent",
          borderBottom: "32px solid #e8732a"
        }} />
        <div className="absolute top-1/3 right-16 w-12 h-12 border-2 border-[#e8732a]/30 rotate-45 opacity-40" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-24">
          
          {/* Date badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 border border-[#e8732a]/50 bg-[#e8732a]/10 rounded-sm">
            <Calendar className="h-3.5 w-3.5 text-[#e8732a]" />
            <span className="text-[#e8732a] text-xs font-bold tracking-[0.2em] uppercase">
              {formatDate(currentProgram.date)}
            </span>
            {currentProgram.time && (
              <>
                <span className="text-[#e8732a]/40 mx-1">|</span>
                <span className="text-[#e8732a] text-xs font-bold tracking-[0.1em]">EN LIGNE</span>
              </>
            )}
          </div>

          {/* Category */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <CategoryIcon className="h-4 w-4 text-white/40" />
            <span className="text-white/40 text-xs font-semibold tracking-[0.3em] uppercase">
              {categoryLabels[currentProgram.category]}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-3 tracking-tight">
            {currentProgram.title}
          </h1>

          {/* Description */}
          {currentProgram.description && (
            <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto mt-4 leading-relaxed line-clamp-2">
              {currentProgram.description}
            </p>
          )}

          {/* Countdown */}
          <CountdownDisplay dateString={currentProgram.date} />

          {/* Meta */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-white/50 text-sm">
            {currentProgram.time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{currentProgram.time}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{currentProgram.location}</span>
            </div>
            {currentProgram.speaker && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{currentProgram.speaker}</span>
              </div>
            )}
          </div>

        </div>

        {/* Slide navigation */}
        {sortedPrograms.length > 1 && (
          <>
            {/* Prev/Next arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center border border-white/20 bg-black/30 text-white hover:bg-[#e8732a] hover:border-[#e8732a] transition-all duration-200"
              aria-label="Programme précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center border border-white/20 bg-black/30 text-white hover:bg-[#e8732a] hover:border-[#e8732a] transition-all duration-200"
              aria-label="Programme suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {sortedPrograms.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === currentSlide 
                      ? "w-8 bg-[#e8732a]" 
                      : "w-2 bg-white/30 hover:bg-white/50"
                  )}
                  aria-label={`Aller au programme ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}


      </section>
    </div>
  )
}