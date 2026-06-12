// Types pour la librairie CCR

export interface Podcast {
  id: string
  title: string
  description: string
  speaker: string
  date: string
  duration: string
  audioUrl: string
  theme: 'foi' | 'delivrance' | 'temoignage' | 'priere'
  coverImage?: string
}

export interface Video {
  id: string
  title: string
  description: string
  speaker: string
  date: string
  youtubeUrl?: string
  videoUrl?: string
  thumbnail: string
  category: 'msi' | 'jeudi_midi' | 'culte_mercredi' | 'culte_dimanche'
}

export interface Ebook {
  id: string
  title: string
  description: string
  author: string
  coverImage: string
  price: number
  isFree: boolean
  pdfUrl?: string
}

export interface PhysicalBook {
  id: string
  title: string
  description: string
  author: string
  coverImage: string
  price: number
  stock: number
}

export interface Order {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  address: string
  country: 'france' | 'benin' | 'cote_ivoire'
  items: OrderItem[]
  totalAmount: number
  shippingFee: number
  status: 'en_attente' | 'paye' | 'livre'
  receiptUrl?: string
  createdAt: string
  deliveryStep?: 1 | 2 | 3  // 1: En cours de préparation, 2: En cours de livraison, 3: Livré
  stepUpdatedAt?: {
    step1?: string
    step2?: string
    step3?: string
  }
}

export interface OrderItem {
  bookId: string
  bookTitle: string
  quantity: number
  price: number
}

export interface EbookOrder {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  ebookId: string
  ebookTitle: string
  ebookAuthor: string
  totalAmount: number
  status: 'en_attente' | 'paye' | 'livre'
  receiptUrl?: string
  createdAt: string
  pdfUrl?: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  country?: 'france' | 'benin' | 'cote_ivoire'
}

export interface SiteSettings {
  logoUrl: string
  siteName: string
  contactEmail: string
  contactPhone: string
  bankAccounts: BankAccount[]
  mobileMoney: MobileMoneyAccount[]
}

export interface ShippingDelays {
  france: string
  benin: string
  cote_ivoire: string
}

export interface BankAccount {
  bankName: string
  accountName: string
  accountNumber: string
  iban?: string
}

export interface MobileMoneyAccount {
  provider: 'wave' | 'orange_money' | 'moov'
  number: string
  name: string
}

export interface UpcomingProgram {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  image: string
  speaker?: string
  category: 'culte' | 'conference' | 'seminaire' | 'evangelisation' | 'jeunesse' | 'autre'
}

export interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image?: string
  buttonText?: string
  buttonLink?: string
  isActive: boolean
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  createdAt: string
  isRead: boolean
}