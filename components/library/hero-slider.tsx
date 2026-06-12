"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Church, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function HeroSlider() {
  const { heroSlides } = useStore()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  
  // Filter only active slides
  const activeSlides = heroSlides.filter(slide => slide.isActive)
  
  const nextSlide = useCallback(() => {
    if (activeSlides.length <= 1) return
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
  }, [activeSlides.length])
  
  const prevSlide = useCallback(() => {
    if (activeSlides.length <= 1) return
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)
  }, [activeSlides.length])
  
  // Auto-slide every 10 seconds
  useEffect(() => {
    if (!isAutoPlaying || activeSlides.length <= 1) return
    
    const interval = setInterval(() => {
      nextSlide()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide, activeSlides.length])
  
  // Reset currentSlide if it exceeds the available slides
  useEffect(() => {
    if (currentSlide >= activeSlides.length && activeSlides.length > 0) {
      setCurrentSlide(0)
    }
  }, [activeSlides.length, currentSlide])
  
  // If no active slides, show a default hero
  if (activeSlides.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background text-foreground pt-24 pb-14 lg:pt-32 lg:pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-primary/10 blur-[140px] rounded-full" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-background/60 border border-border shadow-sm backdrop-blur-md text-muted-foreground mb-7">
            <Church className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium tracking-wide">Centre Chretien de Reveil</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Bienvenue dans notre <span className="text-primary">Librairie Spirituelle</span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Decouvrez des enseignements et ressources chretiennes pour votre edification spirituelle.
          </p>
        </div>
      </section>
    )
  }
  
  const slide = activeSlides[currentSlide]

  return (
    <section 
      className="relative overflow-hidden text-foreground min-h-[600px] lg:min-h-[700px]"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Image with overlay */}
      <div className="absolute inset-0 transition-all duration-1000 ease-out">
        {slide.image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-muted to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative container mx-auto px-4 pt-24 pb-16 lg:pt-32 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content Side */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-background/60 border border-border shadow-sm backdrop-blur-md text-muted-foreground mb-7">
              <Church className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium tracking-wide">{slide.subtitle}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight mb-6">
              {slide.title.split(' ').map((word, i, arr) => {
                // Make the last two words primary colored
                if (i >= arr.length - 2) {
                  return <span key={i} className="text-primary">{word} </span>
                }
                return word + ' '
              })}
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              {slide.description}
            </p>

            {/* Buttons */}
            {slide.buttonText && slide.buttonLink && (
              <div className="flex flex-col sm:flex-row lg:justify-start justify-center gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300 px-7"
                  asChild
                >
                  <Link href={slide.buttonLink}>
                    {slide.buttonText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  className="bg-background text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-lg transition-all duration-300 px-7 font-semibold"
                  asChild
                >
                  <Link href="/livres">Voir les livres</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Image Side - Premium Frame */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Glow Background */}
            <div className="absolute w-[350px] h-[350px] lg:w-[420px] lg:h-[420px] bg-primary/20 blur-[120px] rounded-full" />

            {/* Main Card */}
            <div className="relative w-[280px] md:w-[340px] lg:w-[400px]">
              {/* Outer Gradient Frame */}
              <div className="relative rounded-[32px] lg:rounded-[42px] p-[2px] bg-gradient-to-br from-primary via-primary/80 to-primary/50 shadow-2xl">
                {/* Inner Card */}
                <div className="relative rounded-[30px] lg:rounded-[40px] bg-card/90 backdrop-blur-xl overflow-hidden aspect-[4/5]">
                  {/* Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{ 
                      backgroundImage: `url(${slide.image || '/images/hero-default.jpg'})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              </div>

              {/* Floating Tags */}
              <div className="absolute -top-4 -left-4 lg:-top-6 lg:-left-6 bg-card shadow-lg rounded-full px-3 py-1.5 lg:px-4 lg:py-2 text-xs font-medium border border-border">
                Centre Chretien de Reveil
              </div>

              <div className="absolute -bottom-4 -right-4 lg:-bottom-6 lg:-right-6 bg-card shadow-lg rounded-full px-3 py-1.5 lg:px-4 lg:py-2 text-xs font-medium border border-border">
                Ressources spirituelles
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Controls */}
        {activeSlides.length > 1 && (
          <>
            {/* Arrows */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border-border hover:bg-background z-10"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border-border hover:bg-background z-10"
              onClick={nextSlide}
            >
              <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
            </Button>
            
            {/* Slide Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === currentSlide 
                      ? "w-8 bg-primary" 
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
