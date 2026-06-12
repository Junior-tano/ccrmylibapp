import type { Podcast, Video, Ebook, PhysicalBook, Order, SiteSettings, UpcomingProgram, HeroSlide, ShippingDelays } from './types'

export const mockPodcasts: Podcast[] = []

export const mockVideos: Video[] = []

export const mockEbooks: Ebook[] = []

export const mockPhysicalBooks: PhysicalBook[] = []

export const mockOrders: Order[] = []

export const mockSiteSettings: SiteSettings = {
  logoUrl: '/images/logo-ccr.png',
  siteName: 'Centre Chretien de Reveil',
  contactEmail: 'contact@ccr-eglise.com',
  contactPhone: '+229 97 00 00 00',
  bankAccounts: [
    {
      bankName: 'BGFI Bank',
      accountName: 'Centre Chretien de Reveil',
      accountNumber: 'BJ 0001 0001 0001 0001 0001',
      iban: 'BJ62 0001 0001 0001 0001 0001 001'
    }
  ],
  mobileMoney: [
    { provider: 'wave', number: '+229 97 00 00 01', name: 'CCR Librairie' },
    { provider: 'orange_money', number: '+229 97 00 00 02', name: 'CCR Librairie' },
    { provider: 'moov', number: '+229 97 00 00 03', name: 'CCR Librairie' }
  ]
}

// Frais de livraison par pays (en EUR pour compatibilite interne)
// France: 8 EUR = ~5248 FCFA, Benin: 3 EUR = ~1968 FCFA
export const shippingFees = {
  france: 8.00,       // EUR
  benin: 2000,        // FCFA
  cote_ivoire: 2000   // FCFA
}

// Délais de livraison par pays (configurables par l'administrateur)
export const defaultShippingDelays: ShippingDelays = {
  france: '5-7 jours ouvrables',
  benin: '10-15 jours ouvrables',
  cote_ivoire: '10-15 jours ouvrables',
}

// Alias conservé pour compatibilité
export const shippingFeesFCFA = {
  france: Math.round(8.00 * 655.957),
  benin: 2000,
  cote_ivoire: 2000
}

// Programmes a venir
export const mockUpcomingPrograms: UpcomingProgram[] = []

// Slides Hero Section
export const mockHeroSlides: HeroSlide[] = []

// Categories des programmes
export const programCategories = [
  { value: 'culte', label: 'Culte' },
  { value: 'conference', label: 'Conference' },
  { value: 'seminaire', label: 'Seminaire' },
  { value: 'evangelisation', label: 'Evangelisation' },
  { value: 'jeunesse', label: 'Jeunesse' },
  { value: 'autre', label: 'Autre' }
] as const

// Themes des podcasts
export const podcastThemes = [
  { value: 'foi', label: 'Foi' },
  { value: 'delivrance', label: 'Delivrance' },
  { value: 'temoignage', label: 'Temoignage' },
  { value: 'priere', label: 'Priere' }
] as const

// Categories des videos
export const videoCategories = [
  { value: 'msi', label: 'MSI' },
  { value: 'jeudi_midi', label: 'Jeudi Midi' },
  { value: 'culte_mercredi', label: 'Culte du Mercredi' },
  { value: 'culte_dimanche', label: 'Culte du Dimanche' }
] as const