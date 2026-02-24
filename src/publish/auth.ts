import type { DocsSigner } from "./types.js"

/**
 * Build the EIP-191 message that the backend expects:
 * "auteng:{timestamp}:{nonce}"
 */
export function buildMessage(timestamp: number, nonce: string): string {
  return `auteng:${timestamp}:${nonce}`
}

/** Generate a random nonce string. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** Current unix timestamp in seconds. */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Sign a message and build the wallet auth headers required by the backend.
 *
 * Headers:
 * - X-Wallet-Address
 * - X-Wallet-Signature
 * - X-Wallet-Timestamp
 * - X-Wallet-Nonce
 */
export async function buildAuthHeaders(
  signer: DocsSigner,
): Promise<Record<string, string>> {
  const timestamp = nowSeconds()
  const nonce = generateNonce()
  const message = buildMessage(timestamp, nonce)
  const signature = await signer.signMessage(message)

  return {
    "X-Wallet-Address": signer.address,
    "X-Wallet-Signature": signature,
    "X-Wallet-Timestamp": String(timestamp),
    "X-Wallet-Nonce": nonce,
  }
}
