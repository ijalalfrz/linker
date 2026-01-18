import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ZAFClient } from './zaf-client'
import type { ZendeskClient } from './types'

type MockedZendeskClient = {
  [K in keyof ZendeskClient]: ReturnType<typeof vi.fn>
}

describe('ZendeskClient', () => {
  let mockClient: MockedZendeskClient
  let zendeskClient: ZAFClient
  const customFieldId = '12345'

  beforeEach(() => {
    mockClient = {
      request: vi.fn(),
      invoke: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
    }
    zendeskClient = new ZAFClient(mockClient as ZendeskClient, customFieldId)
  })

  describe('searchTicket', () => {
    it('should search tickets by query string', async () => {
      const query = 'test query'
      const mockResponse = { results: [{ id: 1, subject: 'Test' }] }
      mockClient.request.mockResolvedValue(mockResponse)

      const result = await zendeskClient.searchTicket(query)

      expect(mockClient.request).toHaveBeenCalledWith({
        url: `/api/v2/search.json?query=type:ticket ${encodeURIComponent(query)}`,
        type: 'GET',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle search errors', async () => {
      const error = new Error('Search failed')
      mockClient.request.mockRejectedValue(error)

      await expect(zendeskClient.searchTicket('test')).rejects.toThrow('Search failed')
    })
  })

  describe('searchTicketPagination', () => {
    it('should search tickets with pagination', async () => {
      const query = 'test query'
      const size = 10
      const mockResponse = { results: [{ id: 1 }] }
      mockClient.request.mockResolvedValue(mockResponse)

      const result = await zendeskClient.searchTicketPagination(query, size)

      expect(mockClient.request).toHaveBeenCalledWith({
        url: `/api/v2/search/export.json?query=${encodeURIComponent(query)}&page[size]=${size}&filter[type]=ticket`,
        type: 'GET',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should use default page size of 5', async () => {
      const query = 'test'
      mockClient.request.mockResolvedValue({ results: [] })

      await zendeskClient.searchTicketPagination(query)

      expect(mockClient.request).toHaveBeenCalledWith({
        url: expect.stringContaining('page[size]=5'),
        type: 'GET',
      })
    })
  })

  describe('searchTicketByIds', () => {
    it('should search tickets by array of IDs', async () => {
      const ids = [123, 456, 789]
      const mockResponse = { tickets: [{ id: 123 }, { id: 456 }] }
      mockClient.request.mockResolvedValue(mockResponse)

      const result = await zendeskClient.searchTicketByIds(ids)

      expect(mockClient.request).toHaveBeenCalledWith({
        url: `/api/v2/tickets/show_many.json?ids=${ids.join(',')}`,
        type: 'GET',
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateLinkedTicketsCustomField', () => {
    it('should update linked tickets custom field', async () => {
      const ticketId = 100
      const linkedTickets = ['link:123', 'link:456']
      const mockResponse = { ticket: { id: ticketId } }
      mockClient.request.mockResolvedValue(mockResponse)

      const result = await zendeskClient.updateLinkedTicketsCustomField(ticketId, linkedTickets)

      expect(mockClient.request).toHaveBeenCalledWith({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
          ticket: {
            custom_fields: [
              {
                id: parseInt(customFieldId, 10),
                value: 'link:123,link:456',
              },
            ],
          },
        }),
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle empty linked tickets array', async () => {
      const ticketId = 100
      const linkedTickets: string[] = []
      mockClient.request.mockResolvedValue({ ticket: { id: ticketId } })

      await zendeskClient.updateLinkedTicketsCustomField(ticketId, linkedTickets)

      const callArg = JSON.parse(mockClient.request.mock.calls[0][0].data)
      expect(callArg.ticket.custom_fields[0].value).toBe('')
    })
  })

  describe('updateLinkedTickets', () => {
    it('should update linked tickets for both tickets', async () => {
      const ticketId = 100
      const targetTicketId = 200
      const linkedTickets = ['link:200']
      const targetLinkedTickets = ['link:100']
      const mockResponse = { job_status: { id: 'abc123' } }
      mockClient.request.mockResolvedValue(mockResponse)

      const result = await zendeskClient.updateLinkedTickets(
        ticketId,
        targetTicketId,
        linkedTickets,
        targetLinkedTickets
      )

      expect(mockClient.request).toHaveBeenCalledWith({
        url: `/api/v2/tickets/update_many.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
          tickets: [
            {
              id: ticketId,
              custom_fields: [
                {
                  id: parseInt(customFieldId, 10),
                  value: 'link:200',
                },
              ],
            },
            {
              id: targetTicketId,
              custom_fields: [
                {
                  id: parseInt(customFieldId, 10),
                  value: 'link:100',
                },
              ],
            },
          ],
        }),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('addInternalComment', () => {
    it('should add internal comment to ticket', async () => {
      const ticketId = 100
      const commentBody = 'Linked ticket #123.'
      const mockResponse = { ticket: { id: ticketId } }
      mockClient.request.mockResolvedValue(mockResponse)

      const result = await zendeskClient.addInternalComment(ticketId, commentBody)

      expect(mockClient.request).toHaveBeenCalledWith({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
          ticket: {
            comment: {
              body: commentBody,
              public: false,
            },
          },
        }),
      })
      expect(result).toEqual(mockResponse)
    })

    it('should set comment as non-public', async () => {
      const ticketId = 100
      mockClient.request.mockResolvedValue({ ticket: { id: ticketId } })

      await zendeskClient.addInternalComment(ticketId, 'Test comment')

      const callArg = JSON.parse(mockClient.request.mock.calls[0][0].data)
      expect(callArg.ticket.comment.public).toBe(false)
    })
  })

  describe('getTicket', () => {
    it('should get ticket by ID', async () => {
      const ticketId = 100
      const mockResponse = {
        ticket: {
          id: ticketId,
          subject: 'Test Ticket',
          custom_fields: [{ id: 12345, value: 'link:200' }],
        },
      }
      mockClient.request.mockResolvedValue(mockResponse)

      const result = await zendeskClient.getTicket(ticketId)

      expect(mockClient.request).toHaveBeenCalledWith({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'GET',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle get ticket errors', async () => {
      const error = new Error('Ticket not found')
      mockClient.request.mockRejectedValue(error)

      await expect(zendeskClient.getTicket(999)).rejects.toThrow('Ticket not found')
    })
  })
})
