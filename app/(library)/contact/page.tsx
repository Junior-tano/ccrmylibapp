"use client"

import { useState } from "react"
import emailjs from "@emailjs/browser"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  Church,
  MessageSquare,
  Facebook,
  Youtube
} from "lucide-react"

const contactSubjects = [
  { value: "priere",      label: "Demande de priere" },
  { value: "counseling",  label: "Counseling pastoral" },
  { value: "information", label: "Informations generales" },
  { value: "temoignage",  label: "Partager un temoignage" },
  { value: "don",         label: "Faire un don" },
  { value: "autre",       label: "Autre" },
]

export default function ContactPage() {
  const { siteSettings, addContactMessage } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted,  setIsSubmitted]  = useState(false)
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", subject: "", message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const subjectLabel = contactSubjects.find(s => s.value === formData.subject)?.label ?? formData.subject

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          from_name:  formData.name,
          from_email: formData.email,
          phone:      formData.phone || "Non renseigné",
          subject:    subjectLabel,
          message:    formData.message,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )

      addContactMessage({
        name:    formData.name,
        email:   formData.email,
        phone:   formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      })

      setIsSubmitted(true)
      setTimeout(() => {
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
        setIsSubmitted(false)
      }, 5000)
    } catch (error) {
      console.error("Erreur EmailJS :", error)
      alert("Une erreur est survenue. Veuillez réessayer ou nous contacter directement.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">

      {/* ── Hero compact ── */}
      <section className="relative overflow-hidden py-8 lg:py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 blur-[180px] rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/60 border border-border shadow-sm backdrop-blur-md text-muted-foreground mb-4">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Contactez-nous</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
              Nous sommes là pour{" "}
              <span className="text-primary">vous accompagner</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              Que vous ayez besoin de prière, de conseils pastoraux ou simplement d&apos;informations,
              n&apos;hésitez pas à nous contacter.
            </p>
          </div>
        </div>
      </section>

      {/* ── Infos + Formulaire ── */}
      <section className="pb-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Colonne gauche : infos */}
            <div className="lg:col-span-1 space-y-4">

              {/* Coordonnées */}
              <Card className="border-0 shadow-md bg-card/95 backdrop-blur-sm">
                <CardContent className="p-5 space-y-4">
                  {[
                    {
                      icon: <Phone className="h-5 w-5 text-primary" />,
                      label: "Téléphone",
                      content: (
                        <a href={`tel:${siteSettings.contactPhone}`}
                          className="text-muted-foreground hover:text-primary transition-colors text-sm">
                          {siteSettings.contactPhone}
                        </a>
                      ),
                    },
                    {
                      icon: <Mail className="h-5 w-5 text-primary" />,
                      label: "Email",
                      content: (
                        <a href={`mailto:${siteSettings.contactEmail}`}
                          className="text-muted-foreground hover:text-primary transition-colors break-all text-sm">
                          {siteSettings.contactEmail}
                        </a>
                      ),
                    },
                    {
                      icon: <MapPin className="h-5 w-5 text-primary" />,
                      label: "Adresse",
                      content: (
                        <p className="text-muted-foreground text-sm">
                          Temple Principal CCR<br />Quartier Zongo<br />Cotonou, Bénin
                        </p>
                      ),
                    },
                    {
                      icon: <Clock className="h-5 w-5 text-primary" />,
                      label: "Horaires d'accueil",
                      content: (
                        <p className="text-muted-foreground text-sm">
                          Lundi – Vendredi : 8h – 17h<br />Samedi : 9h – 12h
                        </p>
                      ),
                    },
                  ].map(({ icon, label, content }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-0.5">{label}</h3>
                        {content}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Horaires des cultes */}
              <Card className="border-0 shadow-md bg-card/95 backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Church className="h-4 w-4 text-primary" />
                    Horaires des cultes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="space-y-2">
                    {[
                      { day: "Dimanche",          time: "9h00 & 11h00" },
                      { day: "Mercredi",           time: "18h00" },
                      { day: "Vendredi (Jeunes)",  time: "18h00" },
                    ].map(({ day, time }) => (
                      <div key={day} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-sm text-muted-foreground">{day}</span>
                        <span className="text-sm font-semibold">{time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Réseaux sociaux */}
              <Card className="border-0 shadow-md bg-card/95 backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-base">Suivez-nous</CardTitle>
                  <CardDescription className="text-xs">
                    Restez connectés avec notre communauté
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="flex gap-3">
                    <a href="#" className="w-10 h-10 rounded-xl bg-[#1877f2]/10 flex items-center justify-center hover:bg-[#1877f2]/20 transition-colors">
                      <Facebook className="h-5 w-5 text-[#1877f2]" />
                    </a>
                    <a href="#" className="w-10 h-10 rounded-xl bg-[#ff0000]/10 flex items-center justify-center hover:bg-[#ff0000]/20 transition-colors">
                      <Youtube className="h-5 w-5 text-[#ff0000]" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne droite : formulaire */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-md bg-card/95 backdrop-blur-sm h-full">
                <CardHeader className="pb-3 pt-5 px-6">
                  <CardTitle className="text-xl">Envoyez-nous un message</CardTitle>
                  <CardDescription className="text-sm">
                    Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {isSubmitted ? (
                    /* ── État succès : logo lettre + avion qui remplit tout l'espace ── */
                    <div className="flex flex-col items-center justify-center h-full min-h-[380px] gap-5">
                      {/* Illustration SVG lettre + avion en papier */}
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        {/* Halo animé */}
                        <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping [animation-duration:2s]" />
                        <span className="absolute inset-4 rounded-full bg-primary/10" />

                        <svg
                          viewBox="0 0 160 160"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full drop-shadow-xl"
                        >
                          {/* Enveloppe */}
                          <rect x="18" y="52" width="104" height="76" rx="8"
                            fill="currentColor" className="text-primary/15" stroke="currentColor"
                            strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ color: "hsl(var(--primary))" }} />
                          {/* Rabat enveloppe */}
                          <path d="M18 60 L70 100 L122 60"
                            stroke="currentColor" strokeWidth="3.5"
                            strokeLinecap="round" strokeLinejoin="round"
                            style={{ color: "hsl(var(--primary))" }} fill="none" />
                          {/* Lignes de texte dans l'enveloppe */}
                          <line x1="38" y1="115" x2="82" y2="115"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            style={{ color: "hsl(var(--primary)/0.4)" }} />
                          <line x1="38" y1="122" x2="68" y2="122"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            style={{ color: "hsl(var(--primary)/0.4)" }} />

                          {/* Avion en papier — animé vers le haut-droite */}
                          <g style={{ transformOrigin: "110px 50px" }}
                            className="animate-[send_1.8s_ease-in-out_infinite_alternate]">
                            <path
                              d="M72 62 L138 32 L108 90 L88 72 Z"
                              fill="currentColor"
                              style={{ color: "hsl(var(--primary))" }}
                            />
                            <path
                              d="M88 72 L95 95 L108 90 L88 72Z"
                              fill="currentColor"
                              style={{ color: "hsl(var(--primary)/0.6)" }}
                            />
                            <line x1="88" y1="72" x2="138" y2="32"
                              stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                          </g>

                          {/* Étoiles / étincelles */}
                          <circle cx="140" cy="28" r="3" fill="currentColor"
                            className="animate-pulse" style={{ color: "hsl(var(--primary))" }} />
                          <circle cx="148" cy="18" r="2" fill="currentColor"
                            className="animate-pulse [animation-delay:0.3s]" style={{ color: "hsl(var(--primary)/0.6)" }} />
                          <circle cx="132" cy="16" r="1.5" fill="currentColor"
                            className="animate-pulse [animation-delay:0.6s]" style={{ color: "hsl(var(--primary)/0.4)" }} />
                        </svg>
                      </div>

                      <div className="text-center space-y-1.5">
                        <h3 className="text-lg font-semibold">Message envoyé avec succès !</h3>
                        <p className="text-muted-foreground text-sm max-w-xs">
                          Merci de nous avoir contactés. Notre équipe vous répondra très bientôt.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name">Nom complet *</Label>
                          <Input id="name" placeholder="Votre nom" value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)} required className="h-11" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" placeholder="votre@email.com" value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)} required className="h-11" />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="phone">Téléphone (optionnel)</Label>
                          <PhoneInput
                            id="phone"
                            value={formData.phone}
                            onChange={(val) => handleChange("phone", val)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="subject">Sujet *</Label>
                          <Select value={formData.subject} onValueChange={(v) => handleChange("subject", v)} required>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Sélectionnez un sujet" />
                            </SelectTrigger>
                            <SelectContent>
                              {contactSubjects.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea id="message" placeholder="Décrivez votre demande ou votre besoin..."
                          value={formData.message} onChange={(e) => handleChange("message", e.target.value)}
                          required rows={5} className="resize-none" />
                      </div>

                      <Button type="submit" size="lg" className="w-full sm:w-auto px-8" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer le message
                          </>
                        )}
                      </Button>

                      {/* ── Illustration envoi de mail ── */}
                      <div className="flex items-center justify-center w-full mt-4">
                        <svg
                          viewBox="0 0 420 180"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full max-w-md opacity-20 dark:opacity-15"
                        >
                          {/* Enveloppe */}
                          <rect x="60" y="30" width="220" height="140" rx="12"
                            fill="currentColor" className="text-primary"
                            stroke="currentColor" strokeWidth="5"
                            strokeLinecap="round" strokeLinejoin="round"
                            style={{ color: "hsl(var(--primary))" }} />
                          {/* Rabat / chevron */}
                          <path d="M60 50 L170 115 L280 50"
                            stroke="currentColor" strokeWidth="5"
                            strokeLinecap="round" strokeLinejoin="round"
                            fill="none"
                            style={{ color: "hsl(var(--primary))" }} />
                          {/* Lignes de texte simulées */}
                          <line x1="100" y1="138" x2="200" y2="138"
                            stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                            style={{ color: "hsl(var(--primary))" }} />
                          <line x1="100" y1="152" x2="170" y2="152"
                            stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                            style={{ color: "hsl(var(--primary))" }} />

                          {/* Avion en papier */}
                          <g style={{ transformOrigin: "340px 55px" }}
                            className="animate-[send_1.8s_ease-in-out_infinite_alternate]">
                            <path
                              d="M245 80 L380 28 L330 148 L275 105 Z"
                              fill="currentColor"
                              style={{ color: "hsl(var(--primary))" }}
                            />
                            <path
                              d="M275 105 L288 150 L330 148 L275 105Z"
                              fill="currentColor"
                              style={{ color: "hsl(var(--primary)/0.6)" }}
                            />
                            <line x1="275" y1="105" x2="380" y2="28"
                              stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                          </g>

                          {/* Étincelles */}
                          <circle cx="388" cy="22" r="5" fill="currentColor"
                            className="animate-pulse" style={{ color: "hsl(var(--primary))" }} />
                          <circle cx="400" cy="10" r="3.5" fill="currentColor"
                            className="animate-pulse [animation-delay:0.3s]" style={{ color: "hsl(var(--primary))" }} />
                          <circle cx="374" cy="8" r="2.5" fill="currentColor"
                            className="animate-pulse [animation-delay:0.6s]" style={{ color: "hsl(var(--primary))" }} />
                        </svg>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── Carte Google Maps intégrée ── */}
      <section className="pb-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-1">Notre emplacement</h2>
            <p className="text-muted-foreground text-sm">Retrouvez-nous au Temple Principal CCR</p>
          </div>
          <Card className="overflow-hidden border-0 shadow-md">
            <iframe
              title="Localisation Temple Principal CCR"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.3!2d2.4181!3d6.3654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjEnNTUuNCJOIDLCsDI1JzA1LjIiRQ!5e0!3m2!1sfr!2sbj!4v1"
              width="100%"
              height="320"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Card>
        </div>
      </section>

      {/* Animation keyframes pour l'avion */}
      <style jsx global>{`
        @keyframes send {
          0%   { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(8px, -8px) rotate(3deg); }
        }
      `}</style>

    </div>
  )
}