import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { share, listRecent } from "../publish/sharing.js"
import { DocsApiError } from "../publish/types.js"
import type { DocsSigner } from "../publish/types.js"

const BASE_URL = "http://localhost:8000"

function mockSigner(): DocsSigner {
  return {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    signMessage: vi.fn().mockResolvedValue("0xmocksignature"),
  }
}

describe("share", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch")
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it("sends POST to /api/docs/share with path and visibility", async () => {
    const response = { shareUrl: "/s/doc/abc123" }
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }))

    const result = await share({ signer: mockSigner(), path: "report.md", baseUrl: BASE_URL })

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${BASE_URL}/api/docs/share`)
    expect(init?.method).toBe("POST")
    const body = JSON.parse(init?.body as string)
    expect(body).toEqual({ path: "report.md", visibility: "public" })
    expect(result).toEqual(response)
  })

  it("defaults visibility to public", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ shareUrl: "/s/doc/x" }), { status: 200 }))

    await share({ signer: mockSigner(), path: "report.md", baseUrl: BASE_URL })

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body.visibility).toBe("public")
  })

  it("includes wallet auth headers", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ shareUrl: "/s/doc/x" }), { status: 200 }))

    await share({ signer: mockSigner(), path: "report.md", baseUrl: BASE_URL })

    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers["X-Wallet-Address"]).toBeDefined()
    expect(headers["X-Wallet-Signature"]).toBeDefined()
  })

  it("throws DocsApiError on 404", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ error: "not found" }), { status: 404, statusText: "Not Found" }))

    await expect(share({ signer: mockSigner(), path: "nope.md", baseUrl: BASE_URL }))
      .rejects.toThrow(DocsApiError)
  })

  it("throws DocsApiError on 429 rate limit", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ error: "rate limit" }), { status: 429, statusText: "Too Many Requests" }))

    const err = await share({ signer: mockSigner(), path: "report.md", baseUrl: BASE_URL }).catch((e) => e)
    expect(err).toBeInstanceOf(DocsApiError)
    expect(err.status).toBe(429)
  })
})

describe("listRecent", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch")
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it("sends GET to /api/docs/recent with no auth", async () => {
    const response = { items: [], total: 0, page: 1 }
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }))

    const result = await listRecent({ baseUrl: BASE_URL })

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${BASE_URL}/api/docs/recent`)
    expect(init?.method).toBe("GET")
    // No auth headers
    expect(init?.headers).toBeUndefined()
    expect(result).toEqual(response)
  })

  it("appends page and limit params", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0, page: 2 }), { status: 200 }))

    await listRecent({ page: 2, limit: 10, baseUrl: BASE_URL })

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain("page=2")
    expect(url).toContain("limit=10")
  })

  it("works with no options", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0, page: 1 }), { status: 200 }))

    await listRecent()

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toBe("https://auteng.ai/api/docs/recent")
  })

  it("throws DocsApiError on 500", async () => {
    fetchSpy.mockResolvedValue(new Response("error", { status: 500, statusText: "Internal Server Error" }))

    await expect(listRecent({ baseUrl: BASE_URL }))
      .rejects.toThrow(DocsApiError)
  })
})
