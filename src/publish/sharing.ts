import { buildAuthHeaders } from "./auth.js"
import {
  DocsApiError,
  type ListRecentOptions,
  type ListRecentResponse,
  type ShareOptions,
  type ShareResponse,
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

/** Share a document publicly. Returns the share URL. */
export async function share(options: ShareOptions & { baseUrl?: string }): Promise<ShareResponse> {
  const { signer, path, visibility = "public", baseUrl } = options
  const headers = await buildAuthHeaders(signer)
  const url = `${resolveBaseUrl(baseUrl)}/api/docs/share`

  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ path, visibility }),
  })

  await throwIfNotOk(res)
  return (await res.json()) as ShareResponse
}

/** List the public recents feed. No auth required. */
export async function listRecent(options?: ListRecentOptions & { baseUrl?: string }): Promise<ListRecentResponse> {
  const { page, limit, baseUrl } = options ?? {}
  const base = `${resolveBaseUrl(baseUrl)}/api/docs/recent`
  const params = new URLSearchParams()
  if (page !== undefined) params.set("page", String(page))
  if (limit !== undefined) params.set("limit", String(limit))
  const qs = params.toString()
  const url = qs ? `${base}?${qs}` : base

  const res = await fetch(url, { method: "GET" })

  await throwIfNotOk(res)
  return (await res.json()) as ListRecentResponse
}
