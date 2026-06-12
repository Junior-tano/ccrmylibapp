"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Podcast, Video, Ebook, PhysicalBook, Order, EbookOrder, SiteSettings, UpcomingProgram, HeroSlide, ContactMessage, ShippingDelays } from './types'
import { mockSiteSettings, shippingFees as defaultShippingFees, defaultShippingDelays } from './mock-data'
import { api } from './api'

export interface AdminCredentials {
  email: string
  password: string
}

export interface Notification {
  id: string
  type: 'order' | 'payment' | 'info'
  title: string
  message: string
  orderId?: string
  read: boolean
  createdAt: string
}

interface StoreState {
  // Data
  podcasts: Podcast[]
  videos: Video[]
  ebooks: Ebook[]
  physicalBooks: PhysicalBook[]
  orders: Order[]
  ebookOrders: EbookOrder[]
  siteSettings: SiteSettings
  shippingFees: { france: number; benin: number; cote_ivoire: number }
  shippingDelays: ShippingDelays
  notifications: Notification[]
  upcomingPrograms: UpcomingProgram[]
  heroSlides: HeroSlide[]
  contactMessages: ContactMessage[]
  isApiLoading: boolean
  apiError: string | null
  loadApiData: () => Promise<void>
  loadOrders: () => Promise<void>
  loadEbookOrders: () => Promise<void>

  // Auth
  isAdminAuthenticated: boolean
  adminEmail: string | null

  // Podcast actions
  addPodcast: (podcast: Omit<Podcast, 'id'>) => void
  updatePodcast: (id: string, podcast: Partial<Podcast>) => void
  deletePodcast: (id: string) => void

  // Video actions
  addVideo: (video: Omit<Video, 'id'>) => void
  updateVideo: (id: string, video: Partial<Video>) => void
  deleteVideo: (id: string) => void

  // Ebook actions
  addEbook: (ebook: Omit<Ebook, 'id'>) => void
  updateEbook: (id: string, ebook: Partial<Ebook>) => void
  deleteEbook: (id: string) => void

  // Physical Book actions
  addPhysicalBook: (book: Omit<PhysicalBook, 'id'>) => void
  updatePhysicalBook: (id: string, book: Partial<PhysicalBook>) => void
  deletePhysicalBook: (id: string) => void
  updateBookStock: (id: string, quantityChange: number) => void

  // Order actions — toutes persistées via l'API Laravel
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<string>
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>
  updateOrderDeliveryStep: (id: string, step: 1 | 2 | 3) => Promise<void>
  updateOrderReceipt: (id: string, receiptUrl: string) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  getOrderById: (id: string) => Order | undefined

  // Ebook Order actions — toutes persistées via l'API Laravel
  addEbookOrder: (order: Omit<EbookOrder, 'id' | 'createdAt'>) => Promise<string>
  updateEbookOrderStatus: (id: string, status: EbookOrder['status']) => Promise<void>
  updateEbookOrderReceipt: (id: string, receiptUrl: string) => Promise<void>
  deleteEbookOrder: (id: string) => Promise<void>
  getEbookOrderById: (id: string) => EbookOrder | undefined

  // Settings actions
  updateSiteSettings: (settings: Partial<SiteSettings>) => void
  updateShippingFees: (fees: { france?: number; benin?: number; cote_ivoire?: number }) => void
  updateShippingDelays: (delays: Partial<ShippingDelays>) => void

  // Upcoming Program actions
  addUpcomingProgram: (program: Omit<UpcomingProgram, 'id'>) => void
  updateUpcomingProgram: (id: string, program: Partial<UpcomingProgram>) => void
  deleteUpcomingProgram: (id: string) => void

  // Hero Slide actions
  addHeroSlide: (slide: Omit<HeroSlide, 'id'>) => void
  updateHeroSlide: (id: string, slide: Partial<HeroSlide>) => void
  deleteHeroSlide: (id: string) => void
  toggleHeroSlideActive: (id: string) => void

  // Contact Message actions
  addContactMessage: (message: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>) => void
  markContactMessageRead: (id: string) => void
  deleteContactMessage: (id: string) => void

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  getUnreadCount: () => number

  // Auth actions
  login: (email: string, password: string) => boolean
  logout: () => void
}

const DEFAULT_ADMIN_EMAIL = 'admin@ccr.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial data
      podcasts: [],
      videos: [],
      ebooks: [],
      physicalBooks: [],
      orders: [],
      ebookOrders: [],
      siteSettings: mockSiteSettings,
      shippingFees: defaultShippingFees,
      shippingDelays: defaultShippingDelays,
      notifications: [],
      upcomingPrograms: [],
      heroSlides: [],
      contactMessages: [],
      isApiLoading: false,
      apiError: null,

      // Auth state
      isAdminAuthenticated: false,
      adminEmail: null,

      // ─── Chargement global des données API ────────────────────────────────
      loadApiData: async () => {
        set({ isApiLoading: true, apiError: null })
        try {
          const [podcasts, videos, ebooks, physicalBooks, upcomingPrograms, heroSlides, orders, ebookOrders] = await Promise.all([
            api.list<Podcast>('/podcasts'),
            api.list<Video>('/videos'),
            api.list<Ebook>('/ebooks'),
            api.list<PhysicalBook>('/physical-books'),
            api.list<UpcomingProgram>('/programs'),
            api.list<HeroSlide>('/hero-slides'),
            api.list<Order>('/orders'),
            api.list<EbookOrder>('/ebook-orders'),
          ])
          set({ podcasts, videos, ebooks, physicalBooks, upcomingPrograms, heroSlides, orders, ebookOrders, isApiLoading: false })
        } catch (error) {
          set({ apiError: error instanceof Error ? error.message : 'Erreur API', isApiLoading: false })
        }
      },

      // ─── Chargement commandes physiques depuis l'API ───────────────────────
      loadOrders: async () => {
        try {
          const orders = await api.list<Order>('/orders')
          set({ orders })
        } catch {
          // silencieux — les données du store restent
        }
      },

      // ─── Chargement commandes e-books depuis l'API ────────────────────────
      loadEbookOrders: async () => {
        try {
          const ebookOrders = await api.list<EbookOrder>('/ebook-orders')
          set({ ebookOrders })
        } catch {
          // silencieux
        }
      },

      // ─── Podcasts ─────────────────────────────────────────────────────────
      addPodcast: async (podcast) => {
        const created = await api.create<Podcast, Omit<Podcast, 'id'>>('/podcasts', podcast)
        set((state) => ({ podcasts: [created, ...state.podcasts] }))
      },
      updatePodcast: async (id, podcast) => {
        const updated = await api.update<Podcast, Partial<Podcast>>('/podcasts', id, podcast)
        set((state) => ({ podcasts: state.podcasts.map(p => p.id === id ? updated : p) }))
      },
      deletePodcast: async (id) => {
        await api.delete('/podcasts', id)
        set((state) => ({ podcasts: state.podcasts.filter(p => p.id !== id) }))
      },

      // ─── Videos ───────────────────────────────────────────────────────────
      addVideo: async (video) => {
        const created = await api.create<Video, Omit<Video, 'id'>>('/videos', video)
        set((state) => ({ videos: [created, ...state.videos] }))
      },
      updateVideo: async (id, video) => {
        const updated = await api.update<Video, Partial<Video>>('/videos', id, video)
        set((state) => ({ videos: state.videos.map(v => v.id === id ? updated : v) }))
      },
      deleteVideo: async (id) => {
        await api.delete('/videos', id)
        set((state) => ({ videos: state.videos.filter(v => v.id !== id) }))
      },

      // ─── Ebooks ───────────────────────────────────────────────────────────
      addEbook: async (ebook) => {
        const created = await api.create<Ebook, Omit<Ebook, 'id'>>('/ebooks', ebook)
        set((state) => ({ ebooks: [created, ...state.ebooks] }))
      },
      updateEbook: async (id, ebook) => {
        const updated = await api.update<Ebook, Partial<Ebook>>('/ebooks', id, ebook)
        set((state) => ({ ebooks: state.ebooks.map(e => e.id === id ? updated : e) }))
      },
      deleteEbook: async (id) => {
        await api.delete('/ebooks', id)
        set((state) => ({ ebooks: state.ebooks.filter(e => e.id !== id) }))
      },

      // ─── Physical Books ───────────────────────────────────────────────────
      addPhysicalBook: async (book) => {
        const created = await api.create<PhysicalBook, Omit<PhysicalBook, 'id'>>('/physical-books', book)
        set((state) => ({ physicalBooks: [created, ...state.physicalBooks] }))
      },
      updatePhysicalBook: async (id, book) => {
        const updated = await api.update<PhysicalBook, Partial<PhysicalBook>>('/physical-books', id, book)
        set((state) => ({ physicalBooks: state.physicalBooks.map(b => b.id === id ? updated : b) }))
      },
      deletePhysicalBook: async (id) => {
        await api.delete('/physical-books', id)
        set((state) => ({ physicalBooks: state.physicalBooks.filter(b => b.id !== id) }))
      },
      updateBookStock: (id, quantityChange) => set((state) => ({
        physicalBooks: state.physicalBooks.map(b =>
          b.id === id ? { ...b, stock: Math.max(0, b.stock + quantityChange) } : b
        )
      })),

      // ─── Orders (API Laravel) ─────────────────────────────────────────────

      addOrder: async (order) => {
        // Génère le ref côté frontend pour qu'il soit disponible immédiatement
        const id = `ORD-${Date.now()}`
        const newOrder = await api.create<Order, object>('/orders', {
          id,
          userId: order.userId,
          userName: order.userName,
          userEmail: order.userEmail,
          userPhone: order.userPhone,
          address: order.address,
          country: order.country,
          items: order.items,
          totalAmount: order.totalAmount,
          shippingFee: order.shippingFee,
          status: order.status ?? 'en_attente',
          receiptUrl: order.receiptUrl ?? null,
        })
        set((state) => ({ orders: [newOrder, ...state.orders] }))
        get().addNotification({
          type: 'order',
          title: 'Nouvelle commande',
          message: `Commande ${id} de ${order.userName}`,
          orderId: id,
        })
        // Mise à jour du stock locale (optimiste)
        order.items.forEach(item => {
          get().updateBookStock(item.bookId, -item.quantity)
        })
        return id
      },

      updateOrderStatus: async (id, status) => {
        const updated = await api.patch<Order, object>(`/orders/${id}/status`, { status })
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? updated : o)
        }))
      },

      updateOrderDeliveryStep: async (id, step) => {
        const updated = await api.patch<Order, object>(`/orders/${id}/delivery-step`, { step })
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? updated : o)
        }))
      },

      updateOrderReceipt: async (id, receiptUrl) => {
        const updated = await api.patch<Order, object>(`/orders/${id}/receipt`, { receiptUrl })
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? updated : o)
        }))
      },

      deleteOrder: async (id) => {
        await api.delete('/orders', id)
        set((state) => ({ orders: state.orders.filter(o => o.id !== id) }))
      },

      getOrderById: (id) => get().orders.find(o => o.id === id),

      // ─── Ebook Orders (API Laravel) ───────────────────────────────────────

      addEbookOrder: async (order) => {
        const id = `EBOOK-${Date.now()}`
        const newOrder = await api.create<EbookOrder, object>('/ebook-orders', {
          id,
          userId: order.userId,
          userName: order.userName,
          userEmail: order.userEmail,
          userPhone: order.userPhone,
          ebookId: order.ebookId,
          ebookTitle: order.ebookTitle,
          ebookAuthor: order.ebookAuthor,
          totalAmount: order.totalAmount,
          status: order.status ?? 'en_attente',
          receiptUrl: order.receiptUrl ?? null,
          pdfUrl: order.pdfUrl ?? null,
        })
        set((state) => ({ ebookOrders: [newOrder, ...state.ebookOrders] }))
        get().addNotification({
          type: 'order',
          title: 'Nouvelle commande e-book',
          message: `Commande ${id} de ${order.userName} — ${order.ebookTitle}`,
          orderId: id,
        })
        return id
      },

      updateEbookOrderStatus: async (id, status) => {
        const updated = await api.patch<EbookOrder, object>(`/ebook-orders/${id}/status`, { status })
        set((state) => ({
          ebookOrders: state.ebookOrders.map(o => o.id === id ? updated : o)
        }))
      },

      updateEbookOrderReceipt: async (id, receiptUrl) => {
        const updated = await api.patch<EbookOrder, object>(`/ebook-orders/${id}/receipt`, { receiptUrl })
        set((state) => ({
          ebookOrders: state.ebookOrders.map(o => o.id === id ? updated : o)
        }))
      },

      deleteEbookOrder: async (id) => {
        await api.delete('/ebook-orders', id)
        set((state) => ({ ebookOrders: state.ebookOrders.filter(o => o.id !== id) }))
      },

      getEbookOrderById: (id) => get().ebookOrders.find(o => o.id === id),

      // ─── Settings ─────────────────────────────────────────────────────────
      updateSiteSettings: (settings) => set((state) => ({
        siteSettings: { ...state.siteSettings, ...settings }
      })),
      updateShippingFees: (fees) => set((state) => ({
        shippingFees: { ...state.shippingFees, ...fees }
      })),
      updateShippingDelays: (delays) => set((state) => ({
        shippingDelays: { ...state.shippingDelays, ...delays }
      })),

      // ─── Upcoming Programs ────────────────────────────────────────────────
      addUpcomingProgram: async (program) => {
        const created = await api.create<UpcomingProgram, Omit<UpcomingProgram, 'id'>>('/programs', program)
        set((state) => ({ upcomingPrograms: [created, ...state.upcomingPrograms] }))
      },
      updateUpcomingProgram: async (id, program) => {
        const updated = await api.update<UpcomingProgram, Partial<UpcomingProgram>>('/programs', id, program)
        set((state) => ({ upcomingPrograms: state.upcomingPrograms.map(p => p.id === id ? updated : p) }))
      },
      deleteUpcomingProgram: async (id) => {
        await api.delete('/programs', id)
        set((state) => ({ upcomingPrograms: state.upcomingPrograms.filter(p => p.id !== id) }))
      },

      // ─── Hero Slides ──────────────────────────────────────────────────────
      addHeroSlide: async (slide) => {
        const created = await api.create<HeroSlide, Omit<HeroSlide, 'id'>>('/hero-slides', slide)
        set((state) => ({ heroSlides: [created, ...state.heroSlides] }))
      },
      updateHeroSlide: async (id, slide) => {
        const updated = await api.update<HeroSlide, Partial<HeroSlide>>('/hero-slides', id, slide)
        set((state) => ({ heroSlides: state.heroSlides.map(s => s.id === id ? updated : s) }))
      },
      deleteHeroSlide: async (id) => {
        await api.delete('/hero-slides', id)
        set((state) => ({ heroSlides: state.heroSlides.filter(s => s.id !== id) }))
      },
      toggleHeroSlideActive: async (id) => {
        const slide = get().heroSlides.find(s => s.id === id)
        if (!slide) return
        const updated = await api.update<HeroSlide, Partial<HeroSlide>>('/hero-slides', id, { isActive: !slide.isActive })
        set((state) => ({ heroSlides: state.heroSlides.map(s => s.id === id ? updated : s) }))
      },

      // ─── Contact Messages ─────────────────────────────────────────────────
      addContactMessage: (message) => {
        const newMessage: ContactMessage = {
          ...message,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          isRead: false,
        }
        set((state) => ({ contactMessages: [newMessage, ...state.contactMessages] }))
        get().addNotification({
          type: 'info',
          title: 'Nouveau message',
          message: `Message de ${message.name}: ${message.subject}`,
        })
      },
      markContactMessageRead: (id) => set((state) => ({
        contactMessages: state.contactMessages.map(m => m.id === id ? { ...m, isRead: true } : m)
      })),
      deleteContactMessage: (id) => set((state) => ({
        contactMessages: state.contactMessages.filter(m => m.id !== id)
      })),

      // ─── Notifications ────────────────────────────────────────────────────
      addNotification: (notification) => set((state) => ({
        notifications: [
          { ...notification, id: Date.now().toString(), read: false, createdAt: new Date().toISOString() },
          ...state.notifications,
        ]
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      clearNotifications: () => set({ notifications: [] }),
      getUnreadCount: () => get().notifications.filter(n => !n.read).length,

      // ─── Auth ─────────────────────────────────────────────────────────────
      login: (email, password) => {
        if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
          set({ isAdminAuthenticated: true, adminEmail: email })
          return true
        }
        return false
      },
      logout: () => set({ isAdminAuthenticated: false, adminEmail: null }),
    }),
    {
      name: 'ccr-library-store',
      version: 9,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<StoreState>
        if (version < 5) {
          return {
            ...state,
            podcasts: [], videos: [], ebooks: [], physicalBooks: [],
            orders: [], ebookOrders: [], upcomingPrograms: [],
            heroSlides: [], contactMessages: [], notifications: [],
          }
        }
        if (version < 6) {
          return {
            ...state,
            shippingFees: {
              france: (state.shippingFees as { france?: number })?.france ?? 8,
              benin: (state.shippingFees as { benin?: number })?.benin ?? 2000,
              cote_ivoire: 2000,
            },
          }
        }
        if (version < 7) {
          return { ...state, shippingDelays: defaultShippingDelays }
        }
        if (version < 8) {
          return { ...state, ebookOrders: (state as { ebookOrders?: EbookOrder[] }).ebookOrders ?? [] }
        }
        // Version 9 : suppression des commandes du localStorage (migration vers API)
        if (version < 9) {
          return { ...state, orders: [], ebookOrders: [] }
        }
        return state
      },
      partialize: (state) => ({
        podcasts: state.podcasts,
        videos: state.videos,
        ebooks: state.ebooks,
        physicalBooks: state.physicalBooks,
        // orders & ebookOrders ne sont plus persistés dans localStorage
        // ils sont rechargés depuis l'API à chaque montage
        siteSettings: state.siteSettings,
        shippingFees: state.shippingFees,
        shippingDelays: state.shippingDelays,
        notifications: state.notifications,
        upcomingPrograms: state.upcomingPrograms,
        heroSlides: state.heroSlides,
        contactMessages: state.contactMessages,
        isAdminAuthenticated: state.isAdminAuthenticated,
        adminEmail: state.adminEmail,
      }),
    }
  )
)
