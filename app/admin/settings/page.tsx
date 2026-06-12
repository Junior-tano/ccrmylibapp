"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SiteSettings, ShippingDelays } from "@/lib/types"
import { Settings, Save, Plus, Trash2, Upload, ImageIcon, Clock } from "lucide-react"
import { useStore } from "@/lib/store"

export default function AdminSettings() {
  const { siteSettings, updateSiteSettings, shippingFees: storeFees, updateShippingFees, shippingDelays: storeDelays, updateShippingDelays } = useStore()
  const [settings, setSettings] = useState<SiteSettings>(siteSettings)
  const [fees, setFees] = useState(storeFees)
  const [delays, setDelays] = useState<ShippingDelays>(storeDelays)
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    setSettings(siteSettings)
  }, [siteSettings])

  useEffect(() => {
    setFees(storeFees)
  }, [storeFees])

  useEffect(() => {
    setDelays(storeDelays)
  }, [storeDelays])

  const handleSave = async () => {
    setIsSaving(true)
    // Sauvegarder dans le store global (visible par le frontoffice)
    updateSiteSettings(settings)
    updateShippingFees(fees)
    updateShippingDelays(delays)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert("Parametres sauvegardes avec succes !")
  }

  const compressImage = (file: File, maxWidth: number = 200, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
            resolve(compressedDataUrl)
          } else {
            reject(new Error('Failed to get canvas context'))
          }
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Le logo est trop volumineux. Taille maximum : 500KB")
        e.target.value = ""
        return
      }

      setLogoFile(file)
      try {
        const compressedLogoUrl = await compressImage(file, 200, 0.7)
        setSettings((prev) => ({ ...prev, logoUrl: compressedLogoUrl }))
        updateSiteSettings({ logoUrl: compressedLogoUrl })
      } catch (error) {
        alert("Erreur lors de la compression de l'image. Veuillez réessayer.")
        console.error(error)
      }
    }
  }

  const clearLogo = () => {
    setLogoFile(null)
    setSettings({ ...settings, logoUrl: "" })
    updateSiteSettings({ logoUrl: "" })
  }

  const addBankAccount = () => {
    setSettings({
      ...settings,
      bankAccounts: [
        ...settings.bankAccounts,
        { bankName: "", accountName: "", accountNumber: "", iban: "" }
      ]
    })
  }

  const removeBankAccount = (index: number) => {
    setSettings({
      ...settings,
      bankAccounts: settings.bankAccounts.filter((_, i) => i !== index)
    })
  }

  const updateBankAccount = (index: number, field: string, value: string) => {
    const newAccounts = [...settings.bankAccounts]
    newAccounts[index] = { ...newAccounts[index], [field]: value }
    setSettings({ ...settings, bankAccounts: newAccounts })
  }

  const addMobileMoney = () => {
    setSettings({
      ...settings,
      mobileMoney: [
        ...settings.mobileMoney,
        { provider: "wave", number: "", name: "" }
      ]
    })
  }

  const removeMobileMoney = (index: number) => {
    setSettings({
      ...settings,
      mobileMoney: settings.mobileMoney.filter((_, i) => i !== index)
    })
  }

  const updateMobileMoney = (index: number, field: string, value: string) => {
    const newMobile = [...settings.mobileMoney]
    newMobile[index] = { ...newMobile[index], [field]: value }
    setSettings({ ...settings, mobileMoney: newMobile })
  }

  // Get preview URL for logo
  const logoPreviewUrl = settings.logoUrl || null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parametres</h1>
          <p className="text-muted-foreground">
            Configurez les informations de votre site
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Informations generales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Informations generales
            </CardTitle>
            <CardDescription>
              Les informations de base de votre site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Logo du site
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* File Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Importer depuis l&apos;ordinateur</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/30">
                    <Input
                      id="logoFile"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.svg"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <label htmlFor="logoFile" className="cursor-pointer block">
                      {logoFile ? (
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-background rounded-lg overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                            <img
                              src={settings.logoUrl}
                              alt="Logo Preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-foreground">{logoFile.name}</p>
                            <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
                          <p className="text-sm mt-2 text-muted-foreground">
                            Glissez une image ou <span className="text-primary font-medium">parcourir</span>
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP, SVG (max 500KB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* URL Input + Preview */}
                <div className="space-y-3">
                  <Label htmlFor="logoUrl" className="text-sm font-medium">Ou fournir un lien (URL)</Label>
                  <Input
                    id="logoUrl"
                    value={settings.logoUrl}
                    onChange={(e) => {
                      setLogoFile(null)
                      setSettings({...settings, logoUrl: e.target.value})
                    }}
                    placeholder="https://example.com/logo.png ou /images/logo.png"
                    className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  
                  {/* Preview */}
                  {logoPreviewUrl && (
                    <div className="border border-border rounded-xl p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-medium">Apercu du logo</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearLogo}
                          className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                      <div className="w-full h-20 bg-background rounded-lg flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={settings.logoUrl}
                          alt="Logo Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {!logoPreviewUrl && (
                    <div className="border border-border rounded-xl p-4 bg-muted/30">
                      <div className="w-full h-20 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-xs">Aucun logo selectionne</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Other Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Coordonnees
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nom du site</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de contact</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                    className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contactPhone">Telephone de contact</Label>
                  <Input
                    id="contactPhone"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                    className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frais de livraison */}
        <Card>
          <CardHeader>
            <CardTitle>Frais de livraison</CardTitle>
            <CardDescription>
              Configurez les frais de livraison par pays. France en EUR, Côte d&apos;Ivoire et Bénin en FCFA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="feeFrance">🇫🇷 France (€)</Label>
                <Input
                  id="feeFrance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={fees.france}
                  onChange={(e) => setFees({...fees, france: parseFloat(e.target.value) || 0})}
                  className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeCoteIvoire">🇨🇮 Côte d&apos;Ivoire (FCFA)</Label>
                <Input
                  id="feeCoteIvoire"
                  type="number"
                  step="1"
                  min="0"
                  value={fees.cote_ivoire ?? 0}
                  onChange={(e) => setFees({...fees, cote_ivoire: parseFloat(e.target.value) || 0})}
                  className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeBenin">🇧🇯 Bénin (FCFA)</Label>
                <Input
                  id="feeBenin"
                  type="number"
                  step="1"
                  min="0"
                  value={fees.benin}
                  onChange={(e) => setFees({...fees, benin: parseFloat(e.target.value) || 0})}
                  className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Délais de livraison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Délais de livraison
            </CardTitle>
            <CardDescription>
              Configurez les délais de livraison affichés sur le front-office pour chaque pays.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="delayFrance">🇫🇷 France</Label>
                <Input
                  id="delayFrance"
                  type="text"
                  placeholder="ex: 5-7 jours ouvrables"
                  value={delays.france}
                  onChange={(e) => setDelays({...delays, france: e.target.value})}
                  className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayCoteIvoire">🇨🇮 Côte d&apos;Ivoire</Label>
                <Input
                  id="delayCoteIvoire"
                  type="text"
                  placeholder="ex: 10-15 jours ouvrables"
                  value={delays.cote_ivoire}
                  onChange={(e) => setDelays({...delays, cote_ivoire: e.target.value})}
                  className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayBenin">🇧🇯 Bénin</Label>
                <Input
                  id="delayBenin"
                  type="text"
                  placeholder="ex: 10-15 jours ouvrables"
                  value={delays.benin}
                  onChange={(e) => setDelays({...delays, benin: e.target.value})}
                  className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comptes bancaires */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comptes bancaires</CardTitle>
                <CardDescription>
                  Les comptes pour recevoir les paiements
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addBankAccount}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings.bankAccounts.map((account, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Compte {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBankAccount(index)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nom de la banque</Label>
                    <Input
                      value={account.bankName}
                      onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom du compte</Label>
                    <Input
                      value={account.accountName}
                      onChange={(e) => updateBankAccount(index, 'accountName', e.target.value)}
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Numero de compte</Label>
                    <Input
                      value={account.accountNumber}
                      onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)}
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN (optionnel)</Label>
                    <Input
                      value={account.iban || ''}
                      onChange={(e) => updateBankAccount(index, 'iban', e.target.value)}
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mobile Money */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mobile Money</CardTitle>
                <CardDescription>
                  Les numeros Mobile Money pour les paiements
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addMobileMoney}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings.mobileMoney.map((mobile, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {mobile.provider === 'wave' ? 'Wave' : 
                     mobile.provider === 'orange_money' ? 'Orange Money' : 'Moov Money'}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMobileMoney(index)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Operateur</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md bg-muted/50 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                      value={mobile.provider}
                      onChange={(e) => updateMobileMoney(index, 'provider', e.target.value)}
                    >
                      <option value="wave">Wave</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="moov">Moov Money</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Numero</Label>
                    <Input
                      value={mobile.number}
                      onChange={(e) => updateMobileMoney(index, 'number', e.target.value)}
                      placeholder="+229 97 00 00 00"
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom du compte</Label>
                    <Input
                      value={mobile.name}
                      onChange={(e) => updateMobileMoney(index, 'name', e.target.value)}
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}