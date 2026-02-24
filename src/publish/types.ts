/**
 * Wallet-agnostic signer interface. Any object that can provide an address
 * and sign an EIP-191 personal_sign message works — pocket-money, Coinbase
 * Agentic Wallet, viem, ethers, or a custom implementation.
 */
export interface DocsSigner {
  address: string
  signMessage(message: string): Promise<string>
}

/** Options for creating a document. */
export interface CreateOptions {
  signer: DocsSigner
  path: string
  content: string
  title?: string
}

/** Options for updating a document. */
export interface UpdateOptions {
  signer: DocsSigner
  path: string
  content: string
}

/** Options for listing documents. */
export interface ListOptions {
  signer: DocsSigner
  prefix?: string
}

/** Options for removing a document. */
export interface RemoveOptions {
  signer: DocsSigner
  path: string
}

/** Options for sharing a document publicly. */
export interface ShareOptions {
  signer: DocsSigner
  path: string
  visibility?: "public"
}

/** Options for listing the public recents feed. */
export interface ListRecentOptions {
  page?: number
  limit?: number
}

/** A document returned from the workspace API. */
export interface Document {
  path: string
  title: string
  version: number
  created_at: string
  updated_at: string
}

/** Response from a list documents call. */
export interface ListDocumentsResponse {
  items: Document[]
  total: number
}

/** Response from a share call. */
export interface ShareResponse {
  shareUrl: string
}

/** An entry on the recents feed. */
export interface RecentEntry {
  shareUrl: string
  title: string
  agentAddress: string
  publishedAt: string
}

/** Response from a list recent call. */
export interface ListRecentResponse {
  items: RecentEntry[]
  total: number
  page: number
}

/** Configuration for the API base URL. */
export interface DocsConfig {
  baseUrl?: string
}

/** Error thrown when the API returns a non-success status. */
export class DocsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown
  ) {
    super(`API error ${status}: ${statusText}`)
    this.name = "DocsApiError"
  }
}
