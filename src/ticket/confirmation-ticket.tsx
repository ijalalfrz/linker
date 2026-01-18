import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LinkIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface ConfirmationTicketProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (comment: string) => void
  ticketId: number
  isLoading?: boolean
}

function ConfirmationTicket({
  open,
  onOpenChange,
  onConfirm,
  ticketId,
  isLoading = false,
}: ConfirmationTicketProps) {
  const [comment, setComment] = useState('')

  const handleConfirm = () => {
    try {
      onConfirm(comment)
    } catch (error) {
      console.error('Error in onConfirm:', error)
    } finally {
      setComment('') // Reset after confirm
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setComment('') // Reset on cancel
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Ticket #{ticketId}</DialogTitle>
          <DialogDescription>Add internal comment</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Add a comment (optional)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? <Spinner className="size-4 mr-2" /> : <LinkIcon className="size-4 mr-2" />}
            Link
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmationTicket
