import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Container from './container'
import type { ZendeskClient, Ticket, TicketResponse } from './types'

// Mock environment variable
vi.stubEnv('VITE_LINKED_TICKETS_CUSTOM_FIELD_ID', '123456')

// Mock the ZAFClient
const mockZAFClientInstance = {
  getTicket: vi.fn(),
  updateLinkedTickets: vi.fn(),
  addInternalComment: vi.fn(),
}

vi.mock('./zaf-client', () => ({
  ZAFClient: class MockZAFClient {
    constructor() {
      return mockZAFClientInstance
    }
  },
}))

// Mock the child components
vi.mock('./ticket/search-ticket', () => ({
  default: ({
    onTicketLinked,
  }: {
    onTicketLinked: (ticket: Ticket, comment?: string) => Promise<void>
  }) => (
    <div data-testid="search-ticket">
      <button
        onClick={async () => {
          try {
            await onTicketLinked(
              {
                id: 999,
                subject: 'New Ticket',
                description: 'New description',
                status: 'open',
                priority: 'normal',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              'Test comment'
            )
          } catch (error) {
            console.log(error)
          }
        }}
      >
        Link Ticket
      </button>
    </div>
  ),
}))

vi.mock('./ticket/linked-ticket', () => ({
  default: ({ onTicketUnlinked }: { onTicketUnlinked: (ticketId: number) => Promise<void> }) => (
    <div data-testid="linked-ticket">
      <button
        onClick={async () => {
          try {
            await onTicketUnlinked(2)
          } catch (error) {
            console.log(error)
          }
        }}
      >
        Unlink Ticket
      </button>
    </div>
  ),
}))

describe('Container', () => {
  let mockClient: ZendeskClient

  const mockTicket: Ticket = {
    id: 1,
    subject: 'Current Ticket',
    description: 'Current description',
    status: 'open',
    priority: 'normal',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    mockClient = {} as ZendeskClient

    // Reset all mocks
    vi.clearAllMocks()
  })

  it('should render SearchTicket and LinkedTicket components', () => {
    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={[]} />)

    expect(screen.getByTestId('search-ticket')).toBeInTheDocument()
    expect(screen.getByTestId('linked-ticket')).toBeInTheDocument()
  })

  it('should initialize linkedTicketField with linkedTickets prop', () => {
    const linkedTickets = ['link:2', 'link:3']
    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={linkedTickets} />)

    // Component should render without errors
    expect(screen.getByTestId('search-ticket')).toBeInTheDocument()
  })

  it('should update linkedTicketField when linkedTickets prop changes', () => {
    const { rerender } = render(
      <Container client={mockClient} ticket={mockTicket} linkedTickets={['link:2']} />
    )

    rerender(
      <Container client={mockClient} ticket={mockTicket} linkedTickets={['link:2', 'link:3']} />
    )

    expect(screen.getByTestId('search-ticket')).toBeInTheDocument()
  })

  it('should handle ticket linking successfully', async () => {
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 999,
        subject: 'New Ticket',
        description: 'New description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        custom_fields: [
          {
            id: 123456,
            value: '',
          },
        ],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockResolvedValue(undefined)
    mockZAFClientInstance.addInternalComment.mockResolvedValue(undefined)

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={[]} />)

    const linkButton = screen.getByText('Link Ticket')
    await user.click(linkButton)

    await waitFor(() => {
      expect(mockZAFClientInstance.getTicket).toHaveBeenCalledWith(999)
      expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalledWith(
        1,
        999,
        ['link:999'],
        ['link:1']
      )
      expect(mockZAFClientInstance.addInternalComment).toHaveBeenCalledTimes(2)
      expect(mockZAFClientInstance.addInternalComment).toHaveBeenCalledWith(
        1,
        'Linked ticket #999.\n\nComment: Test comment'
      )
      expect(mockZAFClientInstance.addInternalComment).toHaveBeenCalledWith(
        999,
        'Linked ticket #1.\n\nComment: Test comment'
      )
    })
  })

  it('should handle ticket unlinking successfully', async () => {
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 2,
        subject: 'Linked Ticket',
        description: 'Linked description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        custom_fields: [
          {
            id: 123456,
            value: 'link:1',
          },
        ],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockResolvedValue(undefined)
    mockZAFClientInstance.addInternalComment.mockResolvedValue(undefined)

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={['link:2']} />)

    const unlinkButton = screen.getByText('Unlink Ticket')
    await user.click(unlinkButton)

    await waitFor(() => {
      expect(mockZAFClientInstance.getTicket).toHaveBeenCalledWith(2)
      expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalledWith(1, 2, [], [])
      expect(mockZAFClientInstance.addInternalComment).toHaveBeenCalledTimes(2)
      expect(mockZAFClientInstance.addInternalComment).toHaveBeenCalledWith(
        1,
        'Unlinked ticket #2.'
      )
      expect(mockZAFClientInstance.addInternalComment).toHaveBeenCalledWith(
        2,
        'Unlinked ticket #1.'
      )
    })
  })

  it('should handle target ticket with existing linked tickets', async () => {
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 999,
        subject: 'New Ticket',
        description: 'New description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        custom_fields: [
          {
            id: 123456,
            value: 'link:100,link:200',
          },
        ],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockResolvedValue(undefined)
    mockZAFClientInstance.addInternalComment.mockResolvedValue(undefined)

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={['link:2']} />)

    const linkButton = screen.getByText('Link Ticket')
    await user.click(linkButton)

    await waitFor(() => {
      expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalled()
    })

    // Then verify it was called with the correct arguments
    expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalledWith(
      1,
      999,
      ['link:2', 'link:999'],
      ['link:100', 'link:200', 'link:1']
    )
  })

  it('should handle error when current ticket ID is not available for linking', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    render(<Container client={mockClient} ticket={null} linkedTickets={[]} />)

    const linkButton = screen.getByText('Link Ticket')
    await user.click(linkButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Current ticket ID not available')
      expect(mockZAFClientInstance.updateLinkedTickets).not.toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('should handle error when current ticket ID is not available for unlinking', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    render(<Container client={mockClient} ticket={null} linkedTickets={['link:2']} />)

    const unlinkButton = screen.getByText('Unlink Ticket')
    await user.click(unlinkButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Current ticket ID not available')
      expect(mockZAFClientInstance.updateLinkedTickets).not.toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('should handle error when fetching target ticket linked field', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    mockZAFClientInstance.getTicket.mockRejectedValue(new Error('Fetch failed'))
    mockZAFClientInstance.updateLinkedTickets.mockResolvedValue(undefined)
    mockZAFClientInstance.addInternalComment.mockResolvedValue(undefined)

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={[]} />)

    const linkButton = screen.getByText('Link Ticket')
    await user.click(linkButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching target ticket linked field:',
        expect.any(Error)
      )
      // Should still proceed with empty target linked field
      expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalledWith(
        1,
        999,
        ['link:999'],
        ['link:1']
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('should handle error when linking ticket fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 999,
        subject: 'New Ticket',
        description: 'New description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        custom_fields: [],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockRejectedValue(new Error('Update failed'))

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={[]} />)

    const linkButton = screen.getByText('Link Ticket')

    // error is thrown but caught by the event handler
    await user.click(linkButton)

    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error linking ticket:', expect.any(Error))
      },
      { timeout: 3000 }
    )

    consoleErrorSpy.mockRestore()
  })

  it('should handle error when unlinking ticket fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 2,
        subject: 'Linked Ticket',
        description: 'Linked description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        custom_fields: [
          {
            id: 123456,
            value: 'link:1',
          },
        ],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockRejectedValue(new Error('Update failed'))

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={['link:2']} />)

    const unlinkButton = screen.getByText('Unlink Ticket')

    // The error is thrown but caught by the event handler
    // We just need to wait for it to be logged
    await user.click(unlinkButton)

    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error unlinking ticket:', expect.any(Error))
      },
      { timeout: 3000 }
    )

    consoleErrorSpy.mockRestore()
  })

  it('should handle error when adding internal comment fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 999,
        subject: 'New Ticket',
        description: 'New description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        custom_fields: [],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockResolvedValue(undefined)
    mockZAFClientInstance.addInternalComment.mockRejectedValue(new Error('Comment failed'))

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={[]} />)

    const linkButton = screen.getByText('Link Ticket')
    await user.click(linkButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error adding internal comment:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('should parse target ticket custom field value correctly when it is a string', async () => {
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 999,
        subject: 'New Ticket',
        description: 'New description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        custom_fields: [
          {
            id: 123456,
            value: 'link:5, link:6, link:7',
          },
        ],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockResolvedValue(undefined)
    mockZAFClientInstance.addInternalComment.mockResolvedValue(undefined)

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={[]} />)

    const linkButton = screen.getByText('Link Ticket')
    await user.click(linkButton)

    await waitFor(() => {
      expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalled()
    })

    // Then verify it was called with the correct arguments
    expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalledWith(
      1,
      999,
      ['link:999'],
      ['link:5', 'link:6', 'link:7', 'link:1']
    )
  })

  it('should handle target ticket with no custom fields', async () => {
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 999,
        subject: 'New Ticket',
        description: 'New description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        custom_fields: [],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockResolvedValue(undefined)
    mockZAFClientInstance.addInternalComment.mockResolvedValue(undefined)

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={[]} />)

    const linkButton = screen.getByText('Link Ticket')
    await user.click(linkButton)

    await waitFor(() => {
      expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalledWith(
        1,
        999,
        ['link:999'],
        ['link:1']
      )
    })
  })

  it('should handle target ticket with non-string custom field value', async () => {
    const user = userEvent.setup()
    const mockTargetTicketResponse: TicketResponse = {
      ticket: {
        id: 999,
        subject: 'New Ticket',
        description: 'New description',
        status: 'open',
        priority: 'normal',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        custom_fields: [
          {
            id: 123456,
            value: null,
          },
        ],
      },
    }

    mockZAFClientInstance.getTicket.mockResolvedValue(mockTargetTicketResponse)
    mockZAFClientInstance.updateLinkedTickets.mockResolvedValue(undefined)
    mockZAFClientInstance.addInternalComment.mockResolvedValue(undefined)

    render(<Container client={mockClient} ticket={mockTicket} linkedTickets={[]} />)

    const linkButton = screen.getByText('Link Ticket')
    await user.click(linkButton)

    await waitFor(() => {
      expect(mockZAFClientInstance.updateLinkedTickets).toHaveBeenCalledWith(
        1,
        999,
        ['link:999'],
        ['link:1']
      )
    })
  })
})
