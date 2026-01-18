import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchTicket from './search-ticket'
import { ZAFClient } from '@/zaf-client'
import type { Ticket, TicketSearchResponse } from '../types'

// Mock the ZAFClient
vi.mock('@/zaf-client', () => ({
  ZAFClient: vi.fn(),
}))

describe('SearchTicket', () => {
  let mockClient: {
    searchTicket: ReturnType<typeof vi.fn>
  }
  let mockOnTicketLinked: (ticket: Ticket, comment?: string) => Promise<void>
  const mockTicket: Ticket = {
    id: 1,
    subject: 'Current Ticket',
    description: 'Current ticket description',
    status: 'open',
    priority: 'normal',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    mockClient = {
      searchTicket: vi.fn(),
    }
    mockOnTicketLinked = vi.fn().mockResolvedValue(undefined)
  })

  it('should render search input with placeholder', () => {
    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    expect(screen.getByPlaceholderText('Search ticket by id or title...')).toBeInTheDocument()
  })

  it('should render search button', () => {
    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('should update query value when typing', async () => {
    const user = userEvent.setup()

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test query')

    expect(input).toHaveValue('test query')
  })

  it('should call searchTicket when search button is clicked', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [
        {
          id: 2,
          subject: 'Test Ticket',
          description: 'Test description',
          status: 'open',
          priority: 'high',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ],
      count: 1,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test query')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    expect(mockClient.searchTicket).toHaveBeenCalledWith('test query')
  })

  it('should call searchTicket when Enter key is pressed', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [],
      count: 0,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test query{Enter}')

    expect(mockClient.searchTicket).toHaveBeenCalledWith('test query')
  })

  it('should not search when query is empty', async () => {
    const user = userEvent.setup()

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    expect(mockClient.searchTicket).not.toHaveBeenCalled()
  })

  it('should display search results', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [
        {
          id: 2,
          subject: 'Result Ticket 1',
          description: 'Description 1',
          status: 'open',
          priority: 'high',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
        {
          id: 3,
          subject: 'Result Ticket 2',
          description: 'Description 2',
          status: 'pending',
          priority: 'normal',
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-03T00:00:00Z',
        },
      ],
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/#2 - Result Ticket 1/)).toBeInTheDocument()
      expect(screen.getByText(/#3 - Result Ticket 2/)).toBeInTheDocument()
    })
  })

  it('should display "No results found" when search returns empty', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [],
      count: 0,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'nonexistent')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText('No results found.')).toBeInTheDocument()
    })
  })

  it('should show spinner while loading', async () => {
    const user = userEvent.setup()
    mockClient.searchTicket.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    // Button should be disabled while loading
    expect(searchButton).toBeDisabled()
  })

  it('should filter out current ticket from results', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [
        mockTicket, // Current ticket should be filtered out
        {
          id: 2,
          subject: 'Other Ticket',
          description: 'Other description',
          status: 'open',
          priority: 'normal',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ],
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.queryByText(/#1 - Current Ticket/)).not.toBeInTheDocument()
      expect(screen.getByText(/#2 - Other Ticket/)).toBeInTheDocument()
    })
  })

  it('should filter out already linked tickets', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [
        {
          id: 2,
          subject: 'Linked Ticket',
          description: 'Already linked',
          status: 'open',
          priority: 'normal',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
        {
          id: 3,
          subject: 'Unlinked Ticket',
          description: 'Not linked yet',
          status: 'open',
          priority: 'normal',
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-03T00:00:00Z',
        },
      ],
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={['link:2']} // Ticket #2 is already linked
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.queryByText(/#2 - Linked Ticket/)).not.toBeInTheDocument()
      expect(screen.getByText(/#3 - Unlinked Ticket/)).toBeInTheDocument()
    })
  })

  it('should open confirmation dialog when link button is clicked', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [
        {
          id: 2,
          subject: 'Test Ticket',
          description: 'Test description',
          status: 'open',
          priority: 'normal',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ],
      count: 1,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/#2 - Test Ticket/)).toBeInTheDocument()
    })

    // Find and click the link button (tooltip trigger)
    const linkButtons = screen.getAllByRole('button', { name: '' })
    const linkButton = linkButtons.find(btn => btn.querySelector('svg'))
    expect(linkButton).toBeInTheDocument()

    if (linkButton) {
      await user.click(linkButton)
    }

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Link Ticket #2')).toBeInTheDocument()
    })
  })

  it('should call onTicketLinked when confirming link', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [
        {
          id: 2,
          subject: 'Test Ticket',
          description: 'Test description',
          status: 'open',
          priority: 'normal',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ],
      count: 1,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/#2 - Test Ticket/)).toBeInTheDocument()
    })

    // Click link button
    const linkButtons = screen.getAllByRole('button', { name: '' })
    const linkButton = linkButtons.find(btn => btn.querySelector('svg'))
    if (linkButton) {
      await user.click(linkButton)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Add comment
    const textarea = screen.getByPlaceholderText('Add a comment (optional)...')
    await user.type(textarea, 'Test comment')

    // Click Link button in dialog
    const confirmButton = screen.getByRole('button', { name: /link/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockOnTicketLinked).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          subject: 'Test Ticket',
        }),
        'Test comment'
      )
    })
  })

  it('should handle search error gracefully', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockClient.searchTicket.mockRejectedValue(new Error('Search failed'))

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(screen.getByText('No results found.')).toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })

  it('should display ticket description or fallback text', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [
        {
          id: 2,
          subject: 'Ticket with description',
          description: 'This is a description',
          status: 'open',
          priority: 'normal',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
        {
          id: 3,
          subject: 'Ticket without description',
          description: '',
          status: 'open',
          priority: 'normal',
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-03T00:00:00Z',
        },
      ],
      count: 2,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText('This is a description')).toBeInTheDocument()
      expect(screen.getByText('No description')).toBeInTheDocument()
    })
  })

  it('should close confirmation dialog when onOpenChange is called with false', async () => {
    const user = userEvent.setup()
    const mockResponse: TicketSearchResponse = {
      results: [
        {
          id: 2,
          subject: 'Test Ticket',
          description: 'Test description',
          status: 'open',
          priority: 'normal',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ],
      count: 1,
      next_page: null,
      previous_page: null,
    }
    mockClient.searchTicket.mockResolvedValue(mockResponse)

    render(
      <SearchTicket
        client={mockClient as unknown as ZAFClient}
        ticket={mockTicket}
        linkedTicketField={[]}
        onTicketLinked={mockOnTicketLinked}
      />
    )

    const input = screen.getByPlaceholderText('Search ticket by id or title...')
    await user.type(input, 'test')

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/#2 - Test Ticket/)).toBeInTheDocument()
    })

    // Click link button
    const linkButtons = screen.getAllByRole('button', { name: '' })
    const linkButton = linkButtons.find(btn => btn.querySelector('svg'))
    if (linkButton) {
      await user.click(linkButton)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Click Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
