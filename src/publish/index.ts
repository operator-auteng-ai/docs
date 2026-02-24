export { create, update, list, remove } from "./workspace.js"
export { share, listRecent } from "./sharing.js"
export { buildAuthHeaders, buildMessage, generateNonce } from "./auth.js"
export type {
  DocsSigner,
  CreateOptions,
  UpdateOptions,
  ListOptions,
  RemoveOptions,
  ShareOptions,
  ListRecentOptions,
  Document,
  ListDocumentsResponse,
  ShareResponse,
  RecentEntry,
  ListRecentResponse,
  DocsConfig,
} from "./types.js"
export { DocsApiError } from "./types.js"
