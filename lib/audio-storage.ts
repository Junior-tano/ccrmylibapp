/**
 * audio-storage.ts
 *
 * Gestion du stockage des fichiers audio avec deux stratégies :
 *  1. Backend Laravel disponible ET fichier accepté  → upload /api/uploads/audio
 *  2. Sinon (hors-ligne, 413, timeout, etc.)          → IndexedDB (illimité)
 *
 * IndexedDB est utilisé à la place de localStorage car localStorage
 * est limité à ~5 MB, ce qui est insuffisant pour des fichiers audio.
 */

const DB_NAME    = "libccr_audio"
const DB_VERSION = 1
const STORE_NAME = "audio_files"

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror   = () => reject(request.error)
  })
}

async function saveToIndexedDB(id: string, file: File): Promise<string> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const tx    = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const req   = store.put({
        id,
        name:    file.name,
        type:    file.type || "audio/mpeg",
        size:    file.size,
        buffer:  reader.result as ArrayBuffer,
        savedAt: Date.now(),
      })
      req.onsuccess = () => resolve(`indexeddb://${id}`)
      req.onerror   = () => reject(req.error)
    }
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Résout une URL audio :
 * - URL normale (http/https, data:, /chemin) → retournée telle quelle
 * - indexeddb://xxx → récupéré depuis IndexedDB et converti en blob://
 */
export async function getAudioBlobUrl(audioUrl: string): Promise<string> {
  if (!audioUrl || !audioUrl.startsWith("indexeddb://")) return audioUrl

  const id = audioUrl.replace("indexeddb://", "")
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE_NAME, "readonly")
    const store   = tx.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      const record = request.result
      if (!record) {
        reject(new Error("Fichier audio introuvable dans IndexedDB"))
        return
      }
      const blob    = new Blob([record.buffer as ArrayBuffer], { type: record.type })
      resolve(URL.createObjectURL(blob))
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteFromIndexedDB(audioUrl: string): Promise<void> {
  if (!audioUrl.startsWith("indexeddb://")) return
  const id = audioUrl.replace("indexeddb://", "")
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const req   = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ─── Fonction principale d'upload ────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"

/**
 * Upload un fichier audio.
 * - Essaie d'abord le backend Laravel (8s timeout).
 * - Si le backend est hors-ligne OU répond 413 (fichier trop gros pour PHP)
 *   → stockage automatique dans IndexedDB, retourne "indexeddb://<id>".
 * - Si le backend répond avec une autre erreur (ex: 422) → erreur remontée.
 */
export async function uploadAudioFile(file: File): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 8000)

    const formData = new FormData()
    formData.append("audio", file)

    const response = await fetch(`${API_BASE_URL}/uploads/audio`, {
      method: "POST",
      body:   formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // ✅ Succès → retourner l'URL serveur
    if (response.ok) {
      const result = await response.json().catch(() => null)
      if (result?.url) return result.url as string
      throw new Error("Réponse serveur invalide (pas d'URL retournée)")
    }

    // ⚠️ 413 Content Too Large → PHP refuse le fichier car trop gros
    //    On bascule automatiquement sur IndexedDB
    if (response.status === 413) {
      console.info("[audio-storage] 413 Content Too Large — stockage local IndexedDB activé.")
      const id  = `audio_${Date.now()}_${Math.random().toString(36).slice(2)}`
      return await saveToIndexedDB(id, file)
    }

    // Autre erreur HTTP → on remonte le message
    let errorMsg = `Erreur serveur : ${response.status}`
    try {
      const body = await response.json()
      errorMsg   = body?.message ?? errorMsg
    } catch { /* ignore */ }
    throw new Error(errorMsg)

  } catch (err) {
    // Erreur réseau (backend non démarré, timeout) → IndexedDB
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof DOMException && err.name === "AbortError")

    if (isNetworkError) {
      console.info("[audio-storage] Backend inaccessible — stockage local IndexedDB activé.")
      const id = `audio_${Date.now()}_${Math.random().toString(36).slice(2)}`
      return await saveToIndexedDB(id, file)
    }

    throw err
  }
}

/** true si l'URL pointe vers un fichier stocké localement */
export function isLocalAudio(audioUrl: string): boolean {
  return typeof audioUrl === "string" && audioUrl.startsWith("indexeddb://")
}