// Zendesk Client types
export interface ZendeskRequestOptions {
  url: string
  type: string
  contentType?: string
  data?: string
}

export interface ZendeskClient {
  invoke: <T = void>(method: string, params?: Record<string, unknown>) => Promise<T>
  get: <T = unknown>(path: string) => Promise<T>
  set: <T = void>(path: string, value: unknown) => Promise<T>
  request: <T = unknown>(options: ZendeskRequestOptions) => Promise<T>
}

// Ticket types
export interface Ticket {
  id: number
  subject: string
  description?: string
  status: string
  custom_fields?: CustomField[]
  [key: string]: unknown
}

export interface CustomField {
  id: number
  value: string | string[] | null
}

// API Response types
export interface TicketSearchResponse {
  results: Ticket[]
  count?: number
  next_page?: string | null
  previous_page?: string | null
}

export interface TicketByIdResponse {
  tickets: Ticket[]
}

export interface TicketResponse {
  ticket: Ticket
}

export interface TicketUpdateResponse {
  ticket?: Ticket
  tickets?: Ticket[]
}
