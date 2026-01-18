import type {
  TicketSearchResponse,
  TicketByIdResponse,
  TicketResponse,
  TicketUpdateResponse,
  ZendeskClient,
} from './types'

export class ZAFClient {
  private client: ZendeskClient
  private customLinkedTicketsFieldId: string

  constructor(client: ZendeskClient, customLinkedTicketsFieldId: string) {
    this.client = client
    this.customLinkedTicketsFieldId = customLinkedTicketsFieldId
  }

  /**
   * Search tickets by query string
   * @param query - search query string
   */
  async searchTicket(query: string): Promise<TicketSearchResponse> {
    try {
      const response = await this.client.request<TicketSearchResponse>({
        url: `/api/v2/search.json?query=type:ticket ${encodeURIComponent(query)}`,
        type: 'GET',
      })
      return response
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }

  /**
   * Search tickets by query string with pagination
   * @param query - search query string
   * @param size - number of results per page (default: 5)
   */
  async searchTicketPagination(query: string, size: number = 5): Promise<TicketSearchResponse> {
    try {
      const response = await this.client.request<TicketSearchResponse>({
        url: `/api/v2/search/export.json?query=${encodeURIComponent(query)}&page[size]=${size}&filter[type]=ticket`,
        type: 'GET',
      })
      return response
    } catch (error) {
      console.error('Search pagination error:', error)
      throw error
    }
  }
  /**
   * Search tickets by array of IDs
   * @param ids - array of ticket IDs
   */
  async searchTicketByIds(ids: number[]): Promise<TicketByIdResponse> {
    try {
      const response = await this.client.request<TicketByIdResponse>({
        url: `/api/v2/tickets/show_many.json?ids=${ids.join(',')}`,
        type: 'GET',
      })
      return response
    } catch (error) {
      console.error('Search by IDs error:', error)
      throw error
    }
  }

  /**
   * Update the custom field for linked tickets
   * @param ticketId - current ticket ID
   * @param linkedTickets - array of linked ticket strings like ["link:123", "link:456"]
   */
  async updateLinkedTicketsCustomField(
    ticketId: number,
    linkedTickets: string[]
  ): Promise<TicketResponse> {
    try {
      console.log('Updating linked tickets custom field:', linkedTickets)
      const linkedTicketString = linkedTickets.join(',')
      const payload = {
        ticket: {
          custom_fields: [
            {
              id: parseInt(this.customLinkedTicketsFieldId, 10),
              value: linkedTicketString,
            },
          ],
        },
      }

      const response = await this.client.request<TicketResponse>({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error('Update custom field error:', error)
      throw error
    }
  }

  /**
   * Updates the linked tickets custom field for two tickets simultaneously.
   * This method performs a bulk update operation to maintain bidirectional ticket linking.
   *
   * @param ticketId - The ID of the source ticket to update
   * @param targetTicketId - The ID of the target ticket to update
   * @param linkedTickets - Array of ticket IDs to set as linked tickets for the source ticket
   * @param targetLinkedTickets - Array of ticket IDs to set as linked tickets for the target ticket
   */
  async updateLinkedTickets(
    ticketId: number,
    targetTicketId: number,
    linkedTickets: string[],
    targetLinkedTickets: string[]
  ): Promise<TicketUpdateResponse> {
    try {
      const payload = {
        tickets: [
          {
            id: ticketId,
            custom_fields: [
              {
                id: parseInt(this.customLinkedTicketsFieldId, 10),
                value: linkedTickets.join(','),
              },
            ],
          },
          {
            id: targetTicketId,
            custom_fields: [
              {
                id: parseInt(this.customLinkedTicketsFieldId, 10),
                value: targetLinkedTickets.join(','),
              },
            ],
          },
        ],
      }

      const response = await this.client.request<TicketUpdateResponse>({
        url: `/api/v2/tickets/update_many.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error('Update custom field error:', error)
      throw error
    }
  }

  /**
   * Add an internal comment to a ticket
   * @param ticketId - The ID of the ticket to add the comment to
   * @param commentBody - The body text of the internal comment
   */
  async addInternalComment(ticketId: number, commentBody: string): Promise<TicketResponse> {
    try {
      const payload = {
        ticket: {
          comment: {
            body: commentBody,
            public: false,
          },
        },
      }

      const response = await this.client.request<TicketResponse>({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error('Add internal comment error:', error)
      throw error
    }
  }

  /**
   * Get ticket by ID
   * @param ticketId - The ID of the ticket to retrieve
   */
  async getTicket(ticketId: number): Promise<TicketResponse> {
    try {
      const response = await this.client.request<TicketResponse>({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'GET',
      })
      return response
    } catch (error) {
      console.error('Get ticket error:', error)
      throw error
    }
  }
}
