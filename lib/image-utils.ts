/**
 * Convertit un fichier image en chaîne base64.
 * La chaîne résultante peut être stockée dans le store Zustand (localStorage)
 * et utilisée directement comme src d'une balise <img> ou dans next/image.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"))
    reader.readAsDataURL(file)
  })
}

/**
 * Retourne true si la chaîne est une URL base64 (data URL).
 */
export function isBase64Image(src: string): boolean {
  return src.startsWith("data:")
}

/**
 * Retourne une src sûre pour l'affichage :
 * - Si c'est une data URL → on la retourne telle quelle
 * - Sinon → on retourne l'URL originale (chemin /images/... ou URL externe)
 */
export function getSafeImageSrc(src: string, fallback = "/images/hero-default.jpg"): string {
  if (!src) return fallback
  return src
}
