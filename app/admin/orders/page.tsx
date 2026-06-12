"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Order, EbookOrder } from "@/lib/types"
import { useStore } from "@/lib/store"
import {
  Search, ShoppingCart, Eye, FileImage, ExternalLink, Package, Clock, CheckCircle,
  Globe, BookOpen, X, Truck, PackageCheck, CheckCheck, Trash2, BookMarked, RefreshCw,
} from "lucide-react"
import { formatPrice } from "@/lib/currency"
import { cn } from "@/lib/utils"

export default function AdminOrders() {
  const {
    orders, ebookOrders,
    updateOrderStatus, updateOrderDeliveryStep, updateEbookOrderStatus,
    deleteOrder, deleteEbookOrder, loadOrders, loadEbookOrders,
  } = useStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedEbookOrder, setSelectedEbookOrder] = useState<EbookOrder | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isEbookSheetOpen, setIsEbookSheetOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "order" | "ebook" } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Charge les commandes depuis l'API au montage
  useEffect(() => {
    loadOrders()
    loadEbookOrders()
  }, [loadOrders, loadEbookOrders])

  // Rafraîchit les commandes depuis l'API (bouton)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([loadOrders(), loadEbookOrders()])
    setIsRefreshing(false)
  }, [loadOrders, loadEbookOrders])

  // Synchronise le panel latéral avec la version store (mise à jour en temps réel)
  useEffect(() => {
    if (selectedOrder) {
      const fresh = orders.find(o => o.id === selectedOrder.id)
      if (fresh) setSelectedOrder(fresh)
    }
  }, [orders]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedEbookOrder) {
      const fresh = ebookOrders.find(o => o.id === selectedEbookOrder.id)
      if (fresh) setSelectedEbookOrder(fresh)
    }
  }, [ebookOrders]) // eslint-disable-line react-hooks/exhaustive-deps

  // ----- Filtered lists -----
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredEbookOrders = ebookOrders.filter((order) => {
    const matchesSearch =
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.ebookTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // ----- Handlers -----
  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    await updateOrderStatus(orderId, newStatus)
  }

  const handleEbookStatusChange = async (orderId: string, newStatus: EbookOrder["status"]) => {
    await updateEbookOrderStatus(orderId, newStatus)
  }

  const handleDeliveryStepValidate = async (orderId: string, step: 1 | 2 | 3) => {
    await updateOrderDeliveryStep(orderId, step)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.type === "order") {
      await deleteOrder(deleteTarget.id)
      if (selectedOrder?.id === deleteTarget.id) { setIsSheetOpen(false); setSelectedOrder(null) }
    } else {
      await deleteEbookOrder(deleteTarget.id)
      if (selectedEbookOrder?.id === deleteTarget.id) { setIsEbookSheetOpen(false); setSelectedEbookOrder(null) }
    }
    setDeleteTarget(null)
  }

  // ----- Render helpers -----
  const getStatusBadge = (status: Order["status"] | EbookOrder["status"]) => {
    switch (status) {
      case "en_attente":
        return (
          <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border-0 hover:bg-amber-50 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            En attente
          </Badge>
        )
      case "paye":
        return (
          <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border-0 hover:bg-blue-50 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            Payé
          </Badge>
        )
      case "livre":
        return (
          <Badge className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border-0 hover:bg-green-50 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Livré
          </Badge>
        )
    }
  }

  const getCountryLabel = (country: string) => {
    if (country === "france") return "France"
    if (country === "cote_ivoire") return "Côte d'Ivoire"
    return "Bénin"
  }

  const pendingCount   = orders.filter((o) => o.status === "en_attente").length
  const paidCount      = orders.filter((o) => o.status === "paye").length
  const deliveredCount = orders.filter((o) => o.status === "livre").length
  const pendingEbookCount = ebookOrders.filter((o) => o.status === "en_attente").length

  const deliveryStepsConfig = [
    { step: 1 as const, label: "En cours de préparation", sublabel: "L'équipe prépare votre commande", icon: <Package className="h-4 w-4" />, activeColor: "text-blue-700", activeBg: "bg-blue-50", activeBorder: "border-blue-200", checkBg: "bg-blue-600" },
    { step: 2 as const, label: "En cours de livraison",   sublabel: "Votre colis est en route",       icon: <Truck className="h-4 w-4" />,   activeColor: "text-orange-700", activeBg: "bg-orange-50", activeBorder: "border-orange-200", checkBg: "bg-orange-500" },
    { step: 3 as const, label: "Commande livrée",         sublabel: "Colis remis au destinataire",    icon: <PackageCheck className="h-4 w-4" />, activeColor: "text-green-700", activeBg: "bg-green-50", activeBorder: "border-green-200", checkBg: "bg-green-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Suivez, validez et supprimez les commandes</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "En attente", count: pendingCount,   icon: <Clock className="h-5 w-5 text-orange-600" />, bg: "from-orange-50", iconBg: "bg-orange-100", text: "text-orange-600" },
          { label: "Payées",     count: paidCount,      icon: <Package className="h-5 w-5 text-blue-600" />, bg: "from-blue-50",   iconBg: "bg-blue-100",   text: "text-blue-600" },
          { label: "Livrées",    count: deliveredCount, icon: <CheckCircle className="h-5 w-5 text-green-600" />, bg: "from-green-50", iconBg: "bg-green-100", text: "text-green-600" },
          { label: "E-books en attente", count: pendingEbookCount, icon: <BookMarked className="h-5 w-5 text-purple-600" />, bg: "from-purple-50", iconBg: "bg-purple-100", text: "text-purple-600" },
        ].map(({ label, count, icon, bg, iconBg, text }) => (
          <Card key={label} className={`border-0 shadow-md bg-gradient-to-br ${bg} to-card`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${text}`}>{count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="paye">Payé</SelectItem>
            <SelectItem value="livre">Livré</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 sm:max-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="physical">
        <TabsList>
          <TabsTrigger value="physical" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Livres physiques
            {filteredOrders.length > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{filteredOrders.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ebooks" className="gap-2">
            <BookMarked className="h-4 w-4" />
            E-books
            {filteredEbookOrders.length > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{filteredEbookOrders.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB: LIVRES PHYSIQUES ─── */}
        <TabsContent value="physical" className="mt-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10"><ShoppingCart className="h-4 w-4 text-primary" /></div>
                Commandes de livres physiques
              </CardTitle>
              <CardDescription>{filteredOrders.length} commande(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Aucune commande trouvée</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commande</TableHead>
                        <TableHead className="hidden md:table-cell">Client</TableHead>
                        <TableHead className="hidden sm:table-cell">Pays</TableHead>
                        <TableHead className="hidden lg:table-cell">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden md:table-cell">Suivi</TableHead>
                        <TableHead className="hidden sm:table-cell">Reçu</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.id}</p>
                              <p className="text-sm text-muted-foreground md:hidden">{order.userName}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <p className="font-medium">{order.userName}</p>
                              <p className="text-sm text-muted-foreground">{order.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm">{getCountryLabel(order.country)}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div>
                              <p className="font-medium">{formatPrice(order.totalAmount + order.shippingFee, order.country)}</p>
                              <p className="text-xs text-muted-foreground">dont {formatPrice(order.shippingFee, order.country)} frais</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as Order["status"])}>
                              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="paye">Payé</SelectItem>
                                <SelectItem value="livre">Livré</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3].map((s) => {
                                const isValidated = (order.deliveryStep ?? 0) >= s
                                return (
                                  <div key={s} className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all", isValidated ? "bg-primary text-white border-primary" : "bg-muted/40 text-muted-foreground border-border")}>
                                    {isValidated ? <CheckCheck className="h-3 w-3" /> : s}
                                  </div>
                                )
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {order.receiptUrl ? (
                              <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary/80" onClick={() => { setSelectedOrder(order); setIsSheetOpen(true) }}>
                                <FileImage className="h-4 w-4 mr-1" />Voir
                              </Button>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsSheetOpen(true) }} className="h-8 w-8 hover:bg-primary/10" title="Voir détails">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: order.id, type: "order" })} className="h-8 w-8 hover:bg-destructive/10 text-destructive/70 hover:text-destructive" title="Supprimer">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: E-BOOKS ─── */}
        <TabsContent value="ebooks" className="mt-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100"><BookMarked className="h-4 w-4 text-purple-600" /></div>
                Commandes e-books
              </CardTitle>
              <CardDescription>{filteredEbookOrders.length} commande(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEbookOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Aucune commande e-book trouvée</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commande</TableHead>
                        <TableHead className="hidden md:table-cell">Client</TableHead>
                        <TableHead>E-book</TableHead>
                        <TableHead className="hidden lg:table-cell">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden sm:table-cell">Reçu</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEbookOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.id}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <p className="font-medium">{order.userName}</p>
                              <p className="text-sm text-muted-foreground">{order.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{order.ebookTitle}</p>
                              <p className="text-xs text-muted-foreground">{order.ebookAuthor}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <p className="font-medium">{Number(order.totalAmount).toFixed(2)} €</p>
                          </TableCell>
                          <TableCell>
                            <Select value={order.status} onValueChange={(value) => handleEbookStatusChange(order.id, value as EbookOrder["status"])}>
                              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="paye">Payé</SelectItem>
                                <SelectItem value="livre">Livré</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {order.receiptUrl ? (
                              <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary/80" onClick={() => { setSelectedEbookOrder(order); setIsEbookSheetOpen(true) }}>
                                <FileImage className="h-4 w-4 mr-1" />Voir
                              </Button>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedEbookOrder(order); setIsEbookSheetOpen(true) }} className="h-8 w-8 hover:bg-primary/10">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: order.id, type: "ebook" })} className="h-8 w-8 hover:bg-destructive/10 text-destructive/70 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Physical Order Details Sheet ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-[480px] p-0 flex flex-col h-full gap-0">
          {selectedOrder && (
            <>
              <div className="px-6 pt-6 pb-0 border-b border-border flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-1">Commande</p>
                    <h2 className="text-lg font-semibold text-foreground leading-tight">{selectedOrder.id}</h2>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {new Date(selectedOrder.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive/60 hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget({ id: selectedOrder.id, type: "order" })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60" onClick={() => setIsSheetOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pb-4">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[11px] text-muted-foreground font-medium">
                    <Globe className="h-3 w-3" />{getCountryLabel(selectedOrder.country)}
                  </span>
                </div>
              </div>

              <ScrollArea className="flex-1 overflow-hidden">
                <div className="px-6 py-5 space-y-6">
                  {/* Suivi livraison */}
                  <div>
                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">
                      Suivi de livraison — validation par étapes
                    </p>
                    <div className="border border-border rounded-xl bg-muted/20 p-4">
                      <p className="text-[12px] text-muted-foreground mb-4">
                        Validez chaque étape séquentiellement. Le client verra la progression en temps réel.
                      </p>
                      <div className="space-y-1">
                        {deliveryStepsConfig.map(({ step, label, sublabel, icon, activeColor, activeBg, activeBorder, checkBg }, index) => {
                          const currentStep = selectedOrder.deliveryStep ?? 0
                          const isValidated = currentStep >= step
                          const isNext = currentStep === step - 1
                          const isLocked = currentStep < step - 1
                          const stepKey = `step${step}` as keyof NonNullable<typeof selectedOrder.stepUpdatedAt>
                          const stepDate = selectedOrder.stepUpdatedAt?.[stepKey]
                          return (
                            <div key={step}>
                              {index > 0 && <div className={cn("ml-[17px] w-0.5 h-3", currentStep >= step - 1 ? "bg-primary/50" : "bg-border")} />}
                              <div className={cn("flex items-start gap-3 p-3 rounded-xl border transition-all duration-200", isValidated ? `${activeBg} ${activeBorder}` : isNext ? "bg-card border-border border-dashed" : "bg-muted/10 border-border/30 opacity-40")}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all", isValidated ? `${checkBg} text-white shadow-sm` : "bg-muted border-2 border-border text-muted-foreground")}>
                                  {isValidated ? <CheckCheck className="h-3.5 w-3.5" /> : icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-[12px] font-semibold leading-tight", isValidated ? activeColor : "text-foreground")}>
                                    Étape {step} — {label}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>
                                  {isValidated && stepDate && (
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                                      Validé le {new Date(stepDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  )}
                                </div>
                                {isValidated ? (
                                  <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 flex-shrink-0" onClick={() => handleDeliveryStepValidate(selectedOrder.id, step)}>
                                    Annuler
                                  </Button>
                                ) : isNext ? (
                                  <Button size="sm" className="h-7 text-[11px] px-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm flex-shrink-0" onClick={() => handleDeliveryStepValidate(selectedOrder.id, step)}>
                                    Valider ✓
                                  </Button>
                                ) : isLocked ? (
                                  <span className="text-[10px] text-muted-foreground/30 italic pr-1 flex-shrink-0">Verrouillé</span>
                                ) : null}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-muted-foreground">Progression globale</span>
                          <span className="font-semibold text-primary">{selectedOrder.deliveryStep ?? 0} / 3 étapes</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((selectedOrder.deliveryStep ?? 0) / 3) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Client & Livraison */}
                  <div>
                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">Client &amp; livraison</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/40 border border-border rounded-xl p-3.5">
                        <p className="text-[11px] text-muted-foreground mb-2">Client</p>
                        <p className="text-[13px] font-medium text-foreground">{selectedOrder.userName}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{selectedOrder.userEmail}</p>
                        <p className="text-[11px] text-muted-foreground">{selectedOrder.userPhone}</p>
                      </div>
                      <div className="bg-muted/40 border border-border rounded-xl p-3.5">
                        <p className="text-[11px] text-muted-foreground mb-2">Adresse</p>
                        <p className="text-[12px] text-foreground leading-relaxed">{selectedOrder.address}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{getCountryLabel(selectedOrder.country)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Articles */}
                  <div>
                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">Articles ({selectedOrder.items.length})</p>
                    <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-foreground">{item.bookTitle}</p>
                              <p className="text-[11px] text-muted-foreground">Qté · {item.quantity}</p>
                            </div>
                          </div>
                          <p className="text-[13px] font-medium text-foreground">{formatPrice(item.price * item.quantity, selectedOrder.country)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totaux */}
                  <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span className="text-foreground">{formatPrice(selectedOrder.totalAmount, selectedOrder.country)}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Frais de livraison</span>
                      <span className="text-foreground">{formatPrice(selectedOrder.shippingFee, selectedOrder.country)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 border-t border-border">
                      <span className="text-[13px] font-medium text-foreground">Total</span>
                      <span className="text-base font-semibold text-blue-600">{formatPrice(selectedOrder.totalAmount + selectedOrder.shippingFee, selectedOrder.country)}</span>
                    </div>
                  </div>

                  {/* Changer statut */}
                  <div className="flex items-center justify-between p-3.5 bg-muted/40 border border-border rounded-xl">
                    <p className="text-[13px] font-medium text-foreground">Changer le statut</p>
                    <Select value={selectedOrder.status} onValueChange={(value) => handleStatusChange(selectedOrder.id, value as Order["status"])}>
                      <SelectTrigger className="w-32 h-8 text-xs border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="paye">Payé</SelectItem>
                        <SelectItem value="livre">Livré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reçu */}
                  {selectedOrder.receiptUrl && (
                    <div>
                      <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">Reçu de paiement</p>
                      <div className="border border-border rounded-xl overflow-hidden">
                        {selectedOrder.receiptUrl.endsWith(".pdf") ? (
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><FileImage className="h-3.5 w-3.5" />Document PDF</div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                              <a href={selectedOrder.receiptUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Ouvrir</a>
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                              <img src={selectedOrder.receiptUrl} alt="Reçu de paiement" className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
                              <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><FileImage className="h-3.5 w-3.5" />recu_paiement</div>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                <a href={selectedOrder.receiptUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Ouvrir</a>
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget({ id: selectedOrder.id, type: "order" })}>
                      <Trash2 className="h-4 w-4 mr-2" />Supprimer cette commande
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Ebook Order Details Sheet ── */}
      <Sheet open={isEbookSheetOpen} onOpenChange={setIsEbookSheetOpen}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-[480px] p-0 flex flex-col h-full gap-0">
          {selectedEbookOrder && (
            <>
              <div className="px-6 pt-6 pb-0 border-b border-border flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-1">Commande E-book</p>
                    <h2 className="text-lg font-semibold text-foreground leading-tight">{selectedEbookOrder.id}</h2>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {new Date(selectedEbookOrder.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive/60 hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget({ id: selectedEbookOrder.id, type: "ebook" })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60" onClick={() => setIsEbookSheetOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pb-4">{getStatusBadge(selectedEbookOrder.status)}</div>
              </div>

              <ScrollArea className="flex-1 overflow-hidden">
                <div className="px-6 py-5 space-y-6">
                  <div>
                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">Client</p>
                    <div className="bg-muted/40 border border-border rounded-xl p-3.5">
                      <p className="text-[13px] font-medium text-foreground">{selectedEbookOrder.userName}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{selectedEbookOrder.userEmail}</p>
                      <p className="text-[11px] text-muted-foreground">{selectedEbookOrder.userPhone}</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">E-book commandé</p>
                    <div className="border border-border rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <BookMarked className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{selectedEbookOrder.ebookTitle}</p>
                        <p className="text-[11px] text-muted-foreground">{selectedEbookOrder.ebookAuthor}</p>
                      </div>
                      <p className="ml-auto text-[13px] font-semibold">{Number(selectedEbookOrder.totalAmount).toFixed(2)} €</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-muted/40 border border-border rounded-xl">
                    <p className="text-[13px] font-medium text-foreground">Changer le statut</p>
                    <Select value={selectedEbookOrder.status} onValueChange={(value) => handleEbookStatusChange(selectedEbookOrder.id, value as EbookOrder["status"])}>
                      <SelectTrigger className="w-32 h-8 text-xs border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="paye">Payé</SelectItem>
                        <SelectItem value="livre">Livré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedEbookOrder.receiptUrl && (
                    <div>
                      <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">Reçu de paiement</p>
                      <div className="border border-border rounded-xl overflow-hidden">
                        {selectedEbookOrder.receiptUrl.endsWith(".pdf") ? (
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><FileImage className="h-3.5 w-3.5" />Document PDF</div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                              <a href={selectedEbookOrder.receiptUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Ouvrir</a>
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                              <img src={selectedEbookOrder.receiptUrl} alt="Reçu" className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
                              <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><FileImage className="h-3.5 w-3.5" />recu_paiement</div>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" asChild>
                                <a href={selectedEbookOrder.receiptUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Ouvrir</a>
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedEbookOrder.pdfUrl && (
                    <div className="flex items-center justify-between p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                      <div>
                        <p className="text-[12px] font-medium text-purple-700">PDF e-book à envoyer</p>
                        <p className="text-[11px] text-purple-500">Envoyez ce lien au client par email</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-600" asChild>
                        <a href={selectedEbookOrder.pdfUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Ouvrir</a>
                      </Button>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget({ id: selectedEbookOrder.id, type: "ebook" })}>
                      <Trash2 className="h-4 w-4 mr-2" />Supprimer cette commande
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Confirmation suppression ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La commande <strong>{deleteTarget?.id}</strong> sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
