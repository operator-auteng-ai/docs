import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildMessage, generateNonce, nowSeconds, buildAuthHeaders } from "../publish/auth.js"
import type { DocsSigner } from "../publish/types.js"

describe("buildMessage", () => {
  it("constructs auteng:{timestamp}:{nonce}", () => {
    expect(buildMessage(1708700000, "abc123")).toBe("auteng:1708700000:abc123")
  })
})

describe("generateNonce", () => {
  it("returns a 32-char hex string", () => {
    const nonce = generateNonce()
    expect(nonce).toHaveLength(32)
    expect(nonce).toMatch(/^[0-9a-f]+$/)
  })

  it("returns unique values", () => {
    const nonces = new Set(Array.from({ length: 100 }, () => generateNonce()))
    expect(nonces.size).toBe(100)
  })
})

describe("nowSeconds", () => {
  it("returns unix timestamp in seconds", () => {
    const now = nowSeconds()
    const expected = Math.floor(Date.now() / 1000)
    expect(Math.abs(now - expected)).toBeLessThanOrEqual(1)
  })
})

describe("buildAuthHeaders", () => {
  let signer: DocsSigner

  beforeEach(() => {
    signer = {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      signMessage: vi.fn().mockResolvedValue("0xsignature"),
    }
  })

  it("returns all four required headers", async () => {
    const headers = await buildAuthHeaders(signer)
    expect(headers).toHaveProperty("X-Wallet-Address")
    expect(headers).toHaveProperty("X-Wallet-Signature")
    expect(headers).toHaveProperty("X-Wallet-Timestamp")
    expect(headers).toHaveProperty("X-Wallet-Nonce")
  })

  it("sets X-Wallet-Address to signer.address", async () => {
    const headers = await buildAuthHeaders(signer)
    expect(headers["X-Wallet-Address"]).toBe(signer.address)
  })

  it("sets X-Wallet-Signature from signer.signMessage", async () => {
    const headers = await buildAuthHeaders(signer)
    expect(headers["X-Wallet-Signature"]).toBe("0xsignature")
  })

  it("calls signMessage with the correct message format", async () => {
    const headers = await buildAuthHeaders(signer)
    const timestamp = headers["X-Wallet-Timestamp"]
    const nonce = headers["X-Wallet-Nonce"]
    expect(signer.signMessage).toHaveBeenCalledWith(`auteng:${timestamp}:${nonce}`)
  })

  it("sets a numeric timestamp", async () => {
    const headers = await buildAuthHeaders(signer)
    const ts = Number(headers["X-Wallet-Timestamp"])
    expect(Number.isNaN(ts)).toBe(false)
    expect(ts).toBeGreaterThan(0)
  })

  it("sets a hex nonce", async () => {
    const headers = await buildAuthHeaders(signer)
    expect(headers["X-Wallet-Nonce"]).toMatch(/^[0-9a-f]{32}$/)
  })
})
