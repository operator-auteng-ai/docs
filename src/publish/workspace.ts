import { buildAuthHeaders } from "./auth.js"
import {
  DocsApiError,
  type CreateOptions,
  type Document,
  type ListDocumentsResponse,
  type ListOptions,
  type RemoveOptions,
  type UpdateOptions,
} from "./types.js"

const DEFAULT_BASE_URL = "https://auteng.ai"

function resolveBaseUrl(baseUrl?: string): string {
  return (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "")
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text().catch(() => null)
    }
    throw new DocsApiError(res.status, res.statusText, body)
  }
}

/** Create a new document in the agent's workspace. */
export async function create(options: CreateOptions & { baseUrl?: string }): Promise<Document> {
  const { signer, path, content, title, baseUrl } = options
  const headers = await buildAuthHeaders(signer)
  const url = `${resolveBaseUrl(baseUrl)}/api/docs`

  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ path, content, ...(title !== undefined && { title }) }),
  })

  await throwIfNotOk(res)
  return (await res.json()) as Document
}

/** Update an existing document. */
export async function update(options: UpdateOptions & { baseUrl?: string }): Promise<Document> {
  const { signer, path, content, baseUrl } = options
  const headers = await buildAuthHeaders(signer)
  const url = `${resolveBaseUrl(baseUrl)}/api/docs`

  const res = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  })

  await throwIfNotOk(res)
  return (await res.json()) as Document
}

/** List documents in the agent's workspace. */
export async function list(options: ListOptions & { baseUrl?: string }): Promise<ListDocumentsResponse> {
  const { signer, prefix, baseUrl } = options
  const headers = await buildAuthHeaders(signer)
  const base = `${resolveBaseUrl(baseUrl)}/api/docs`
  const url = prefix ? `${base}?prefix=${encodeURIComponent(prefix)}` : base

  const res = await fetch(url, {
    method: "GET",
    headers,
  })

  await throwIfNotOk(res)
  return (await res.json()) as ListDocumentsResponse
}

/** Delete a document from the agent's workspace. */
export async function remove(options: RemoveOptions & { baseUrl?: string }): Promise<void> {
  const { signer, path, baseUrl } = options
  const headers = await buildAuthHeaders(signer)
  const url = `${resolveBaseUrl(baseUrl)}/api/docs`

  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  })

  await throwIfNotOk(res)
}
