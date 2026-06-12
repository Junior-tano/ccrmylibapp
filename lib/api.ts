const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `API request failed: ${response.status}`
    const contentType = response.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      const errorBody = await response.json().catch(() => null)
      message = errorBody?.message ?? message
    } else {
      const text = await response.text().catch(() => "")
      message = text || message
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

async function uploadFile(path: string, fieldName: string, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append(fieldName, file)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    let message = `Upload failed: ${response.status}`
    const contentType = response.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      const errorBody = await response.json().catch(() => null)
      message = errorBody?.message ?? message
    } else {
      const text = await response.text().catch(() => "")
      message = text || message
    }
    throw new Error(message)
  }

  return response.json()
}

export const api = {
  list:   <T>(path: string, params?: Record<string, string>) => {
    const url = params ? `${path}?${new URLSearchParams(params).toString()}` : path
    return request<T[]>(url)
  },
  create: <T, P>(path: string, payload: P) =>
    request<T>(path, { method: "POST", body: JSON.stringify(payload) }),
  update: <T, P>(path: string, id: string, payload: P) =>
    request<T>(`${path}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  patch: <T, P>(path: string, payload: P) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (path: string, id: string) =>
    request<null>(`${path}/${id}`, { method: "DELETE" }),

  uploadAudio:   (file: File) => uploadFile("/uploads/audio",   "audio",   file),
  uploadImage:   (file: File) => uploadFile("/uploads/images",  "image",   file),
  uploadReceipt: (file: File) => uploadFile("/uploads/receipts","receipt", file),
}
