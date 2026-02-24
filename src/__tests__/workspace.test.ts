import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { create, update, list, remove } from "../publish/workspace.js"
import { DocsApiError } from "../publish/types.js"
import type { DocsSigner } from "../publish/types.js"

const BASE_URL = "http://localhost:8000"

function mockSigner(): DocsSigner {
  return {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    signMessage: vi.fn().mockResolvedValue("0xmocksignature"),
  }
}

describe("create", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch")
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it("sends POST to /api/docs with correct body", async () => {
    const doc = { path: "report.md", title: "report", version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(doc), { status: 201 }))

    const result = await create({ signer: mockSigner(), path: "report.md", content: "# Hello", baseUrl: BASE_URL })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${BASE_URL}/api/docs`)
    expect(init?.method).toBe("POST")
    const body = JSON.parse(init?.body as string)
    expect(body).toEqual({ path: "report.md", content: "# Hello" })
    expect(result).toEqual(doc)
  })

  it("includes title when provided", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }))

    await create({ signer: mockSigner(), path: "report.md", content: "# Hello", title: "My Report", baseUrl: BASE_URL })

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body.title).toBe("My Report")
  })

  it("omits title when not provided", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }))

    await create({ signer: mockSigner(), path: "report.md", content: "# Hello", baseUrl: BASE_URL })

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body).not.toHaveProperty("title")
  })

  it("includes wallet auth headers", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }))

    await create({ signer: mockSigner(), path: "report.md", content: "# Hello", baseUrl: BASE_URL })

    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers["X-Wallet-Address"]).toBeDefined()
    expect(headers["X-Wallet-Signature"]).toBeDefined()
    expect(headers["X-Wallet-Timestamp"]).toBeDefined()
    expect(headers["X-Wallet-Nonce"]).toBeDefined()
    expect(headers["Content-Type"]).toBe("application/json")
  })

  it("throws DocsApiError on 409 conflict", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ error: "exists" }), { status: 409, statusText: "Conflict" }))

    await expect(create({ signer: mockSigner(), path: "report.md", content: "# Hello", baseUrl: BASE_URL }))
      .rejects.toThrow(DocsApiError)
  })
})

describe("update", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch")
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it("sends PUT to /api/docs", async () => {
    const doc = { path: "report.md", title: "report", version: 2, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(doc), { status: 200 }))

    const result = await update({ signer: mockSigner(), path: "report.md", content: "# Updated", baseUrl: BASE_URL })

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${BASE_URL}/api/docs`)
    expect(init?.method).toBe("PUT")
    expect(result).toEqual(doc)
  })

  it("throws DocsApiError on 404", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ error: "not found" }), { status: 404, statusText: "Not Found" }))

    await expect(update({ signer: mockSigner(), path: "nope.md", content: "x", baseUrl: BASE_URL }))
      .rejects.toThrow(DocsApiError)
  })
})

describe("list", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch")
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it("sends GET to /api/docs", async () => {
    const response = { items: [], total: 0 }
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }))

    const result = await list({ signer: mockSigner(), baseUrl: BASE_URL })

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${BASE_URL}/api/docs`)
    expect(init?.method).toBe("GET")
    expect(result).toEqual(response)
  })

  it("appends prefix query param", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }))

    await list({ signer: mockSigner(), prefix: "reports/", baseUrl: BASE_URL })

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toBe(`${BASE_URL}/api/docs?prefix=reports%2F`)
  })

  it("omits prefix when not provided", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }))

    await list({ signer: mockSigner(), baseUrl: BASE_URL })

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toBe(`${BASE_URL}/api/docs`)
  })
})

describe("remove", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch")
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it("sends DELETE to /api/docs with path in body", async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 204 }))

    await remove({ signer: mockSigner(), path: "report.md", baseUrl: BASE_URL })

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${BASE_URL}/api/docs`)
    expect(init?.method).toBe("DELETE")
    const body = JSON.parse(init?.body as string)
    expect(body).toEqual({ path: "report.md" })
  })

  it("throws DocsApiError on 404", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ error: "not found" }), { status: 404, statusText: "Not Found" }))

    await expect(remove({ signer: mockSigner(), path: "nope.md", baseUrl: BASE_URL }))
      .rejects.toThrow(DocsApiError)
  })
})
