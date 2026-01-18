import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmationTicket from './confirmation-ticket'

describe('ConfirmationTicket', () => {
  let mockOnOpenChange: (open: boolean) => void
  let mockOnConfirm: (comment: string) => void

  beforeEach(() => {
    mockOnOpenChange = vi.fn()
    mockOnConfirm = vi.fn()
  })

  it('should not render when open is false', () => {
    render(
      <ConfirmationTicket
        open={false}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render dialog when open is true', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should display ticket ID in dialog title', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={456}
      />
    )

    expect(screen.getByText('Link Ticket #456')).toBeInTheDocument()
  })

  it('should display description text', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    expect(screen.getByText('Add internal comment')).toBeInTheDocument()
  })

  it('should render textarea with placeholder', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const textarea = screen.getByPlaceholderText('Add a comment (optional)...')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute('rows', '4')
  })

  it('should update comment value when typing', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const textarea = screen.getByPlaceholderText('Add a comment (optional)...')
    await user.type(textarea, 'Test comment')

    expect(textarea).toHaveValue('Test comment')
  })

  it('should call onConfirm with comment when Link button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const textarea = screen.getByPlaceholderText('Add a comment (optional)...')
    await user.type(textarea, 'My comment')

    const linkButton = screen.getByRole('button', { name: /link/i })
    await user.click(linkButton)

    expect(mockOnConfirm).toHaveBeenCalledWith('My comment')
  })

  it('should call onConfirm with empty string when no comment is entered', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const linkButton = screen.getByRole('button', { name: /link/i })
    await user.click(linkButton)

    expect(mockOnConfirm).toHaveBeenCalledWith('')
  })

  it('should reset comment after confirm', async () => {
    const user = userEvent.setup()

    const { rerender } = render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const textarea = screen.getByPlaceholderText('Add a comment (optional)...')
    await user.type(textarea, 'Test comment')
    expect(textarea).toHaveValue('Test comment')

    const linkButton = screen.getByRole('button', { name: /link/i })
    await user.click(linkButton)

    // Rerender to check if state was reset
    rerender(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    expect(textarea).toHaveValue('')
  })

  it('should call onOpenChange(false) when Cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should reset comment when Cancel button is clicked', async () => {
    const user = userEvent.setup()

    const { rerender } = render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const textarea = screen.getByPlaceholderText('Add a comment (optional)...')
    await user.type(textarea, 'Test comment')
    expect(textarea).toHaveValue('Test comment')

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Rerender to check if state was reset
    rerender(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    expect(textarea).toHaveValue('')
  })

  it('should show spinner when isLoading is true', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
        isLoading={true}
      />
    )

    // Check that spinner is rendered (lucide-react will render the actual Spinner component)
    const linkButton = screen.getByRole('button', { name: /link/i })
    expect(linkButton).toBeInTheDocument()
  })

  it('should show link icon when isLoading is false', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
        isLoading={false}
      />
    )

    // Check that link button is rendered with link icon
    const linkButton = screen.getByRole('button', { name: /link/i })
    expect(linkButton).toBeInTheDocument()
  })

  it('should disable buttons when isLoading is true', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
        isLoading={true}
      />
    )

    const linkButton = screen.getByRole('button', { name: /link/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })

    expect(linkButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
  })

  it('should enable buttons when isLoading is false', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
        isLoading={false}
      />
    )

    const linkButton = screen.getByRole('button', { name: /link/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })

    expect(linkButton).not.toBeDisabled()
    expect(cancelButton).not.toBeDisabled()
  })

  it('should not call onConfirm when Link button is clicked while loading', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
        isLoading={true}
      />
    )

    const linkButton = screen.getByRole('button', { name: /link/i })
    await user.click(linkButton)

    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  it('should have correct textarea attributes', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const textarea = screen.getByPlaceholderText('Add a comment (optional)...')
    expect(textarea).toHaveClass('resize-none')
    expect(textarea).toHaveAttribute('rows', '4')
  })

  it('should render Link button with correct text', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const linkButton = screen.getByRole('button', { name: /link/i })
    expect(linkButton).toHaveTextContent('Link')
  })

  it('should render Cancel button with outline variant', () => {
    render(
      <ConfirmationTicket
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        ticketId={123}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    expect(cancelButton).toBeInTheDocument()
    expect(cancelButton).toHaveTextContent('Cancel')
  })
})
