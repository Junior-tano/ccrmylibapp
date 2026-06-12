// Utilitaires pour la gestion des devises
// Les prix sont stockés en FCFA dans la base de données.

// Taux de change
export const EUR_TO_XOF_RATE = 655.957
export const XOF_TO_EUR_RATE = 1 / 655.957

export function fcfaToEur(fcfaAmount: number | string | undefined | null): number {
  const num = typeof fcfaAmount === "string" ? parseFloat(fcfaAmount) : (fcfaAmount ?? 0)
  if (!isFinite(num)) return 0
  return num * XOF_TO_EUR_RATE
}

export function eurToFcfa(eurAmount: number | string | undefined | null): number {
  const num = typeof eurAmount === "string" ? parseFloat(eurAmount) : (eurAmount ?? 0)
  if (!isFinite(num)) return 0
  return Math.round(num * EUR_TO_XOF_RATE)
}

// Alias
export function eurToXof(v: number | string | undefined | null): number { return eurToFcfa(v) }
export function xofToEur(v: number | string | undefined | null): number { return fcfaToEur(v) }

/**
 * Formate un prix (stocké en FCFA) selon le pays :
 * - france      → EUR
 * - benin / cote_ivoire → FCFA
 */
export function formatPrice(
  fcfaAmount: number | string | undefined | null,
  country: "france" | "benin" | "cote_ivoire" = "benin"
): string {
  const num = typeof fcfaAmount === "string" ? parseFloat(fcfaAmount) : (fcfaAmount ?? 0)
  if (!isFinite(num)) return country === "france" ? "0.00 €" : "0 FCFA"

  if (country === "france") {
    return `${fcfaToEur(num).toFixed(2)} €`
  }
  return `${num.toLocaleString("fr-FR")} FCFA`
}

export function formatFCFA(fcfaAmount: number | string | undefined | null): string {
  const num = typeof fcfaAmount === "string" ? parseFloat(fcfaAmount) : (fcfaAmount ?? 0)
  if (!isFinite(num)) return "0 FCFA"
  return `${num.toLocaleString("fr-FR")} FCFA`
}

export function formatEUR(fcfaAmount: number | string | undefined | null): string {
  return `${fcfaToEur(fcfaAmount).toFixed(2)} €`
}

export function formatPriceShort(
  fcfaAmount: number | string | undefined | null,
  country: "france" | "benin" | "cote_ivoire" = "benin"
): string {
  return formatPrice(fcfaAmount, country)
}

export function formatPriceFull(fcfaAmount: number | string | undefined | null): { eur: string; fcfa: string } {
  const num = typeof fcfaAmount === "string" ? parseFloat(fcfaAmount) : (fcfaAmount ?? 0)
  return {
    eur:  `${fcfaToEur(num).toFixed(2)} €`,
    fcfa: `${isFinite(num) ? num.toLocaleString("fr-FR") : "0"} FCFA`,
  }
}

export function isEuroCountry(country: string): boolean {
  return country === "france"
}

/**
 * Frais de livraison :
 * - france → valeur en EUR
 * - benin / cote_ivoire → valeur en FCFA
 * Guard : si amount est undefined/NaN, affiche 0
 */
export function formatShipping(
  amount: number | undefined | null,
  country: "france" | "benin" | "cote_ivoire"
): string {
  const val = amount ?? 0
  if (!isFinite(val)) return country === "france" ? "0.00 €" : "0 FCFA"
  if (country === "france") return `${val.toFixed(2)} €`
  return `${val.toLocaleString("fr-FR")} FCFA`
}

/**
 * Total d'une commande. subtotalFcfa en FCFA, shippingFee dans l'unité native du pays.
 */
export function formatTotal(
  subtotalFcfa: number | undefined | null,
  shippingFee: number | undefined | null,
  country: "france" | "benin" | "cote_ivoire"
): string {
  const sub = subtotalFcfa ?? 0
  const ship = shippingFee ?? 0
  if (country === "france") {
    const total = fcfaToEur(sub) + ship
    return `${total.toFixed(2)} €`
  }
  return `${(sub + ship).toLocaleString("fr-FR")} FCFA`
}