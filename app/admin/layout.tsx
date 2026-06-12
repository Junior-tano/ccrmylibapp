"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import {
  Mic,
  Video,
  BookOpen,
  Book,
  ShoppingCart,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Image,
  Shield,
  ExternalLink,
  Pencil,
  Upload
} from "lucide-react"

const navigation = [
  { name: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { name: "Hero Section", href: "/admin/hero", icon: Image },
  { name: "Programmes", href: "/admin/programs", icon: Calendar },
  { name: "Podcasts", href: "/admin/podcasts", icon: Mic },
  { name: "Enseignements", href: "/admin/videos", icon: Video },
  { name: "E-books", href: "/admin/ebooks", icon: BookOpen },
  { name: "Livres physiques", href: "/admin/books", icon: Book },
  { name: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { name: "Parametres", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>("")
  const logoInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    isAdminAuthenticated, 
    adminEmail, 
    logout, 
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    loadApiData
  } = useStore()

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    setMounted(true)
    loadApiData()
    const saved = localStorage.getItem("admin-site-logo")
    if (saved) setLogoUrl(saved)
  }, [loadApiData])

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  // Allow access to login page without authentication
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  // Redirect to login if not authenticated
  if (!isAdminAuthenticated) {
    router.push("/admin/login")
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setLogoUrl(base64)
      localStorage.setItem("admin-site-logo", base64)
    }
    reader.readAsDataURL(file)
    if (logoInputRef.current) logoInputRef.current.value = ""
  }

  const handleNotificationClick = (notificationId: string, orderId?: string) => {
    markNotificationRead(notificationId)
    if (orderId) {
      router.push("/admin/orders")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/admin" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-sidebar-border/50" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">CCR</span>
              </div>
            )}
            <span className="font-semibold text-sm">Administration</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            title="Changer le logo"
            className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {item.name === "Commandes" && unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
            Connecte: {adminEmail}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-xs px-1"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={markAllNotificationsRead}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Tout lire
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-destructive hover:text-destructive"
                      onClick={clearNotifications}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucune notification
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 cursor-pointer",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() => handleNotificationClick(notification.id, notification.orderId)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          notification.type === 'order' ? 'bg-primary' : 
                          notification.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'
                        )} />
                        <span className="font-medium text-sm flex-1">{notification.title}</span>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-destructive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground pl-4">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/60 pl-4">
                        {new Date(notification.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-medium">
                      {adminEmail?.slice(0, 2).toUpperCase() || "AD"}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:block">Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {adminEmail?.slice(0, 2).toUpperCase() || "AD"}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Admin</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">{adminEmail}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Parametres du compte
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Shield className="h-4 w-4 mr-2" />
                  Parametres de securite
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir le site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se deconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 bg-muted/30 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
