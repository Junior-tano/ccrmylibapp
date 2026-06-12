"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Book,
  BookOpen,
  Mic,
  Video,
  ShoppingCart,
  TrendingUp,
  Package,
  Truck,
  Bell,
  ArrowUpRight
} from "lucide-react"
import { cn } from "@/lib/utils"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminDashboardPage() {
  const {
    physicalBooks,
    ebooks,
    podcasts,
    videos,
    upcomingPrograms,
    heroSlides,
    orders,
    ebookOrders,
    contactMessages,
    notifications,
    loadApiData,
    isApiLoading
  } = useStore()

  useEffect(() => {
    loadApiData()
  }, [loadApiData])

  const allOrders = [...orders, ...ebookOrders]
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalOrders = allOrders.length
  const totalContent = podcasts.length + videos.length + ebooks.length + physicalBooks.length + heroSlides.length + upcomingPrograms.length
  const deliveredCount = allOrders.filter((o) => o.status === "livre").length

  const unreadNotifications = notifications.filter((n) => !n.read).length

  const mainStats = [
    {
      label: "Revenus totaux",
      value: `${totalRevenue.toLocaleString("fr-FR")} FCFA`,
      change: "+16.5%",
      changeLabel: "ce mois",
      icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Commandes",
      value: totalOrders,
      change: "+20%",
      changeLabel: "ce mois",
      icon: ShoppingCart,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Contenu",
      sublabel: "podcasts, vidéos, livres",
      value: totalContent,
      change: "+2",
      changeLabel: "cette semaine",
      icon: Package,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      label: "Livraisons",
      sublabel: "commandes livrées",
      value: deliveredCount,
      change: "+100%",
      changeLabel: "taux de livraison",
      icon: Truck,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
  ]

  const contentCards = [
    {
      label: "Podcasts",
      value: podcasts.length,
      icon: Mic,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      label: "Vidéos",
      value: videos.length,
      icon: Video,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-100",
    },
    {
      label: "E-books",
      value: ebooks.length,
      icon: BookOpen,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
    },
    {
      label: "Livres",
      value: physicalBooks.length,
      icon: Book,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100",
    },
  ]

  const recentAllOrders = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const statusConfig: Record<string, { label: string; className: string }> = {
    en_attente: { label: "En attente", className: "bg-amber-50 text-amber-700 border-amber-200" },
    paye: { label: "Payée", className: "bg-blue-50 text-blue-700 border-blue-200" },
    livre: { label: "Livrée", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  }

  const orderCounts = {
    en_attente: allOrders.filter((o) => o.status === "en_attente").length,
    paye: allOrders.filter((o) => o.status === "paye").length,
    livre: allOrders.filter((o) => o.status === "livre").length,
  }
  const maxCount = Math.max(orderCounts.en_attente, orderCounts.paye, orderCounts.livre, 1)

  const statBars = [
    { label: "En attente", count: orderCounts.en_attente, color: "bg-amber-400", widthPct: (orderCounts.en_attente / maxCount) * 100 },
    { label: "Payées", count: orderCounts.paye, color: "bg-blue-400", widthPct: (orderCounts.paye / maxCount) * 100 },
    { label: "Livrées", count: orderCounts.livre, color: "bg-emerald-400", widthPct: (orderCounts.livre / maxCount) * 100 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bienvenue dans votre espace d&apos;administration
          </p>
        </div>
        <Badge variant="outline" className="w-fit shrink-0 border-primary/30 text-primary bg-primary/5">
          <Bell className="h-3.5 w-3.5 mr-1.5" />
          {unreadNotifications} notification{unreadNotifications !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* ── Row 1 : 4 main stats cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((s) => (
          <Card key={s.label} className="rounded-2xl border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-emerald-600 font-medium flex items-center">
                      <ArrowUpRight className="h-3 w-3" />
                      {s.change}
                    </span>
                    <span className="text-muted-foreground">{s.changeLabel}</span>
                  </div>
                </div>
                <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", s.iconBg)}>
                  <s.icon className={cn("h-4 w-4", s.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Row 2 : 4 content cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {contentCards.map((c) => (
          <Card key={c.label} className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", c.iconBg)}>
                <c.icon className={cn("h-5 w-5", c.iconColor)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Row 3 : Recent Orders + Order Stats ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-primary">Commandes récentes</h2>
                <p className="text-xs text-muted-foreground">Les dernières commandes effectuées</p>
              </div>
              <Link href="/admin/orders" className="text-xs text-primary hover:underline flex items-center">
                Voir tout <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>

            {isApiLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Chargement...</div>
            ) : recentAllOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucune commande pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAllOrders.map((order) => {
                  const cfg = statusConfig[order.status] ?? statusConfig.en_attente
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card/40 hover:bg-card/70 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {getInitials(order.userName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{order.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-medium", cfg.className)}>
                          {cfg.label}
                        </Badge>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {order.totalAmount.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Statistics */}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-primary">Statistiques des commandes</h2>
              <p className="text-xs text-muted-foreground">Répartition par statut</p>
            </div>

            <div className="space-y-5">
              {statBars.map((bar) => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{bar.label}</span>
                    <span className="text-sm font-semibold">{bar.count}</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", bar.color)}
                      style={{ width: `${bar.widthPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-amber-500">{orderCounts.en_attente}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">En attente</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-500">{orderCounts.paye}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payées</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-500">{orderCounts.livre}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Livrées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}