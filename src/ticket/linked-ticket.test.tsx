import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LinkedTicket from './linked-ticket'
import { ZAFClient } from '@/zaf-client'
import type { Ticket, TicketByIdResponse, TicketSearchResponse } from '../types'

// Mock the ZAFClient
vi.mock('@/zaf-client', () => ({
  ZAFClient: vi.fn(),
}))

describe('LinkedTicket', () => {
  let mockClient: {
    searchTicketByIds: ReturnType<typeof vi.fn>
    searchTicketPagination: ReturnType<typeof vi.fn>
  }
  let mockOnTicketLinked: (ticket: Ticket, comment?: string) => Promise<void>
  let mockOnTicketUnlinked: (ticketId: number) => Promise<void>
  let mockSetLinkedTicketObjects: (tickets: Ticket[]) => void

  const mockTicket: Ticket = {
    id: 1,
    subject: 'Current Ticket Subject',
    description: 'Current ticket description',
    status: 'open',
    priority: 'normal',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  const mockLinkedTickets: Ticket[] = [
    {
      id: 2,
      subject: 'Linked Ticket 1',
      description: 'Description 1',
      status: 'open',
      priority: 'high',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
    {
      id: 3,
      subject: 'Linked Ticket 2',
      description: 'Description 2',
      status: 'pending',
      priority: 'normal',
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
    },
  ]

  const mockSimilarTickets: Ticket[] = [
    {
      id: 4,
      subject: 'Similar Ticket 1',
      description: 'Similar description 1',
      status: 'new',
      priority: 'normal',
      created_at: '2025-01-04T00:00:00Z',
      updated_at: '2025-01-04T00:00:00Z',
    },
    {
      id: 5,
      subject: 'Similar Ticket 2',
      description: 'Similar description 2',
      status: 'solved',
      priority: 'low',
      created_at: '2025-01-05T00:00:00Z',
      updated_at: '2025-01-05T00:00:00Z',
    },
  ]

  beforeEach(() => {
    mockClient = {
      searchTicketByIds: vi.fn(),
      searchTicketPagination: vi.fn(),
    }
    mockOnTicketLinked = vi.fn().mockResolvedValue(undefined)
    mockOnTicketUnlinked = vi.fn().mockResolvedValue(undefined)
    mockSetLinkedTicketObjects = vi.fn()

    // Default mock to prevent errors in tests that don't focus on similar tickets
    mockClient.searchTicketPagination.mockResolvedValue({
      results: [],
      count: 0,
      next_page: null,
      previous_page: null,
    })
  })

  it('should render tabs for linked and similar tickets', () => {
    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    expect(screen.getByRole('tab', { name: /linked tickets/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /similar tickets/i })).toBeInTheDocument()
  })

  it('should display "No linked tickets" when there are no linked tickets', () => {
    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    expect(screen.getByText('No linked tickets.')).toBeInTheDocument()
  })

  it('should display linked tickets', () => {
    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2', 'link:3']}
        linkedTicketObjects={mockLinkedTickets}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    expect(screen.getByText(/#2/)).toBeInTheDocument()
    expect(screen.getByText('Linked Ticket 1')).toBeInTheDocument()
    expect(screen.getByText(/#3/)).toBeInTheDocument()
    expect(screen.getByText('Linked Ticket 2')).toBeInTheDocument()
  })

  it('should fetch linked tickets on mount when linkedTicketField is not empty', async () => {
    const mockResponse: TicketByIdResponse = {
      tickets: mockLinkedTickets,
    }
    mockClient.searchTicketByIds.mockResolvedValue(mockResponse)

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2', 'link:3']}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    await waitFor(() => {
      expect(mockClient.searchTicketByIds).toHaveBeenCalledWith([2, 3])
      expect(mockSetLinkedTicketObjects).toHaveBeenCalledWith(mockLinkedTickets)
    })
  })

  it('should not fetch linked tickets when linkedTicketObjects already contains all needed tickets', async () => {
    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2', 'link:3']}
        linkedTicketObjects={mockLinkedTickets}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    await waitFor(() => {
      expect(mockClient.searchTicketByIds).not.toHaveBeenCalled()
    })
  })

  it('should fetch similar tickets based on ticket subject', async () => {
    const mockResponse: TicketSearchResponse = {
      results: mockSimilarTickets,
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    await waitFor(() => {
      expect(mockClient.searchTicketPagination).toHaveBeenCalledWith('Current Ticket Subject', 11)
    })
  })

  it('should display similar tickets in Similar Tickets tab', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: mockSimilarTickets,
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
    await user.click(similarTab)

    await waitFor(() => {
      expect(screen.getByText(/#4/)).toBeInTheDocument()
      expect(screen.getByText('Similar Ticket 1')).toBeInTheDocument()
      expect(screen.getByText(/#5/)).toBeInTheDocument()
      expect(screen.getByText('Similar Ticket 2')).toBeInTheDocument()
    })
  })

  it('should display badge with count of similar tickets', async () => {
    const mockResponse: TicketSearchResponse = {
      results: mockSimilarTickets,
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    await waitFor(() => {
      const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
      expect(similarTab).toHaveTextContent('2')
    })
  })

  it('should call onTicketUnlinked when unlink button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2']}
        linkedTicketObjects={[mockLinkedTickets[0]]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    // Find unlink buttons (they don't have accessible names, so we need to find by icon or parent)
    const unlinkButtons = screen.getAllByRole('button')
    const unlinkButton = unlinkButtons.find(btn => {
      const svg = btn.querySelector('svg')
      return svg && !svg.closest('a') // Not inside a link
    })

    expect(unlinkButton).toBeInTheDocument()
    if (unlinkButton) {
      await user.click(unlinkButton)
    }

    await waitFor(() => {
      expect(mockOnTicketUnlinked).toHaveBeenCalledWith(2)
    })
  })

  it('should open confirmation dialog when link button is clicked in similar tickets', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: mockSimilarTickets,
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
    await user.click(similarTab)

    await waitFor(() => {
      expect(screen.getByText(/#4/)).toBeInTheDocument()
    })

    // Find link buttons in similar tickets
    const linkButtons = screen.getAllByRole('button')
    const linkButton = linkButtons.find(btn => {
      const svg = btn.querySelector('svg')
      return svg && !svg.closest('a') && btn.closest('[role="tabpanel"]')
    })

    if (linkButton) {
      await user.click(linkButton)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Link Ticket #4')).toBeInTheDocument()
    })
  })

  it('should call onTicketLinked when confirming link from similar tickets', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: mockSimilarTickets,
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
    await user.click(similarTab)

    await waitFor(() => {
      expect(screen.getByText(/#4/)).toBeInTheDocument()
    })

    // Find all buttons in the similar tickets tab panel
    const tabPanel = screen.getByRole('tabpanel')
    const buttons = tabPanel.querySelectorAll('button')

    // The link button should be the last button (after external link)
    const linkButton = Array.from(buttons).find(btn => {
      // Look for LinkIcon (not UnlinkIcon or ExternalLinkIcon)
      const svg = btn.querySelector('svg')
      return svg && btn.type === 'button' && !btn.closest('a')
    })

    expect(linkButton).toBeTruthy()

    if (linkButton) {
      await user.click(linkButton)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Add comment and confirm
    const textarea = screen.getByPlaceholderText('Add a comment (optional)...')
    await user.type(textarea, 'Linking similar ticket')

    const confirmButton = screen.getByRole('button', { name: /link/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockOnTicketLinked).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 4,
          subject: 'Similar Ticket 1',
        }),
        'Linking similar ticket'
      )
    })
  })

  it('should display status badges with correct colors', () => {
    const ticketsWithStatuses: Ticket[] = [
      { ...mockLinkedTickets[0], status: 'open' },
      { ...mockLinkedTickets[1], status: 'solved' },
    ]

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2', 'link:3']}
        linkedTicketObjects={ticketsWithStatuses}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const badges = screen.getAllByText(/open|solved/i)
    expect(badges).toHaveLength(2)
    expect(badges[0]).toHaveTextContent('open')
    expect(badges[1]).toHaveTextContent('solved')
  })

  it('should display "No similar tickets found" when there are no similar tickets', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [],
      count: 0,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
    await user.click(similarTab)

    await waitFor(() => {
      expect(screen.getByText('No similar tickets found.')).toBeInTheDocument()
    })
  })

  it('should filter out current ticket and linked tickets from similar results', async () => {
    const mockResponse: TicketSearchResponse = {
      results: [
        mockTicket, // Current ticket - should be filtered
        mockLinkedTickets[0], // Linked ticket - should be filtered
        ...mockSimilarTickets,
      ],
      count: 4,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    const user = userEvent.setup()

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2']}
        linkedTicketObjects={[mockLinkedTickets[0]]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
    await user.click(similarTab)

    await waitFor(() => {
      expect(screen.queryByText(/#1/)).not.toBeInTheDocument() // Current ticket filtered
      expect(screen.queryByText(/#2/)).not.toBeInTheDocument() // Linked ticket filtered
      expect(screen.getByText(/#4/)).toBeInTheDocument()
      expect(screen.getByText(/#5/)).toBeInTheDocument()
    })
  })

  it('should display loading skeleton while fetching linked tickets', async () => {
    const mockResponse: TicketByIdResponse = {
      tickets: mockLinkedTickets,
    }
    mockClient.searchTicketByIds.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
    )

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2', 'link:3']}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    // Should show skeleton while loading
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should display external link button for each ticket', () => {
    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2']}
        linkedTicketObjects={[mockLinkedTickets[0]]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const externalLinks = screen.getAllByRole('link')
    expect(externalLinks.length).toBeGreaterThan(0)
    expect(externalLinks[0]).toHaveAttribute('target', '_blank')
    expect(externalLinks[0]).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should display info message about similar tickets limit', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: mockSimilarTickets,
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
    await user.click(similarTab)

    await waitFor(() => {
      expect(screen.getByText('Showing up to 10 similar tickets.')).toBeInTheDocument()
    })
  })

  it('should handle error when fetching linked tickets', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockClient.searchTicketByIds.mockRejectedValue(new Error('Fetch failed'))

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2', 'link:3']}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(mockSetLinkedTicketObjects).toHaveBeenCalledWith([])
    })

    consoleErrorSpy.mockRestore()
  })

  it('should handle error when fetching similar tickets', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockClient.searchTicketPagination.mockRejectedValue(new Error('Fetch failed'))

    const user = userEvent.setup()

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
    await user.click(similarTab)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(screen.getByText('No similar tickets found.')).toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })

  it('should limit similar tickets to 10', async () => {
    const manyTickets: Ticket[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 10,
      subject: `Test-Similar Ticket ${i + 1}`,
      description: `Description ${i + 1}`,
      status: 'open',
      priority: 'normal',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }))

    const mockResponse: TicketSearchResponse = {
      results: manyTickets,
      count: 15,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicketPagination.mockResolvedValue(mockResponse)

    const user = userEvent.setup()

    render(
      <LinkedTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        linkedTicketObjects={[]}
        setLinkedTicketObjects={mockSetLinkedTicketObjects}
        onTicketLinked={mockOnTicketLinked}
        onTicketUnlinked={mockOnTicketUnlinked}
      />
    )

    const similarTab = screen.getByRole('tab', { name: /similar tickets/i })
    await user.click(similarTab)

    await waitFor(() => {
      const ticketItems = screen.getAllByText(/Test-Similar Ticket/)
      expect(ticketItems.length).toBeLessThanOrEqual(10)
    })
  })
})
