import { useState, useEffect } from 'react'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Badge } from '@/components/ui/badge'
import { ExternalLinkIcon, UnlinkIcon, InfoIcon, LinkIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getLinkedTicketIds } from './ticket-helper'
import { ZAFClient } from '@/zaf-client'
import { Spinner } from '@/components/ui/spinner'
import ConfirmationTicket from './confirmation-ticket'
import type { Ticket } from '../types'

const statusColorMap: Record<string, string> = {
  open: 'bg-status-open text-status-open-foreground',
  new: 'bg-status-new text-status-new-foreground',
  'on-hold': 'bg-status-on-hold text-status-on-hold-foreground',
  pending: 'bg-status-pending text-status-pending-foreground',
  solved: 'bg-status-solved text-status-solved-foreground',
  closed: 'bg-status-closed text-status-closed-foreground',
}

interface LinkedTicketProps {
  client: ZAFClient
  ticket?: Ticket | null
  linkedTicketField: string[]
  linkedTicketObjects: Ticket[]
  setLinkedTicketObjects: (tickets: Ticket[]) => void
  onTicketLinked: (ticket: Ticket, comment?: string) => Promise<void>
  onTicketUnlinked: (ticketId: number) => Promise<void>
}

function LinkedTicket({
  client,
  ticket,
  linkedTicketField,
  linkedTicketObjects,
  setLinkedTicketObjects,
  onTicketLinked,
  onTicketUnlinked,
}: LinkedTicketProps) {
  const zendeskBaseUrl = import.meta.env.VITE_ZENDESK_BASE_URL

  const [loading, setLoading] = useState(false)
  const [unlinkingTicketId, setUnlinkingTicketId] = useState<number | null>(null)
  const [similarTickets, setSimilarTickets] = useState<Ticket[]>([])
  const [similarLoading, setSimilarLoading] = useState(false)
  const [linkingTicketId, setLinkingTicketId] = useState<number | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [linkedSimilarTicketIds, setLinkedSimilarTicketIds] = useState<Set<number>>(new Set())

  const linkedTicketIds = getLinkedTicketIds(linkedTicketField)

  useEffect(() => {
    const fetchLinkedTickets = async () => {
      if (!linkedTicketIds || linkedTicketIds.length === 0) {
        setLinkedTicketObjects([])
        return
      }

      // Check if we already have all the tickets we need
      const currentTicketIds = new Set(linkedTicketObjects.map(t => t.id))
      const allTicketsPresent = linkedTicketIds.every(id => currentTicketIds.has(id))

      if (allTicketsPresent && linkedTicketIds.length === linkedTicketObjects.length) {
        return // Skip fetching if we already have all tickets
      }

      setLoading(true)
      try {
        const response = await client.searchTicketByIds(linkedTicketIds)
        setLinkedTicketObjects(response.tickets || [])
      } catch (error) {
        console.error('Error fetching linked tickets:', error)
        setLinkedTicketObjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchLinkedTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedTicketIds.join(',')])

  // fetch similar tickets based on current ticket title
  useEffect(() => {
    const fetchSimilarTickets = async () => {
      if (!ticket?.subject) {
        setSimilarTickets([])
        return
      }

      setSimilarLoading(true)
      try {
        // handle exclude linked tickets and current ticket
        const linkedTicketIdSet = new Set([ticket.id, ...linkedTicketIds])
        const response = await client.searchTicketPagination(
          ticket.subject,
          10 + linkedTicketIdSet.size
        )
        let filteredTickets = (response.results || []).filter(
          (t: Ticket) => !linkedTicketIdSet.has(t.id)
        )
        filteredTickets = filteredTickets.slice(0, 10) // limit to 10 tickets
        setSimilarTickets(filteredTickets)
      } catch (error) {
        console.error('Error fetching similar tickets:', error)
        setSimilarTickets([])
      } finally {
        setSimilarLoading(false)
      }
    }

    fetchSimilarTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id])

  // unlink ticket handler
  const handleUnlinkTicket = async (ticketId: number) => {
    setUnlinkingTicketId(ticketId)
    try {
      await onTicketUnlinked(ticketId)

      // Find the unlinked ticket and add back to similar tickets
      // this only happen with ticket that come from similar tickets and been unlinked
      const unlinkedTicket = linkedTicketObjects.find(t => t.id === ticketId)
      if (unlinkedTicket && linkedSimilarTicketIds.has(ticketId)) {
        setSimilarTickets(prev => {
          const newTickets = [unlinkedTicket, ...prev]
          return newTickets.slice(0, 10) // Keep max 10 tickets
        })
      }
    } catch (error) {
      console.error('Error unlinking ticket:', error)
    } finally {
      setUnlinkingTicketId(null)
    }
  }

  // link similar ticket handler
  const handleLinkSimilarTicket = async (ticketId: number) => {
    setSelectedTicketId(ticketId)
    setConfirmDialogOpen(true)
  }

  const handleConfirmLink = async (comment: string) => {
    if (!selectedTicketId) {
      console.error('Selected ticket ID not available')
      return
    }

    setLinkingTicketId(selectedTicketId)
    try {
      // Validate and find the ticket data from similar results
      const newTicket = similarTickets.find(t => t.id === selectedTicketId)

      if (newTicket) {
        await onTicketLinked(newTicket, comment)
      }

      // Remove from similar tickets
      setSimilarTickets(prev => prev.filter(t => t.id !== selectedTicketId))
      setLinkedSimilarTicketIds(prev => prev.add(selectedTicketId))
      setConfirmDialogOpen(false)
      setSelectedTicketId(null)
    } catch (error) {
      console.error('Error linking ticket:', error)
    } finally {
      setLinkingTicketId(null)
    }
  }

  const skeletonComponent = (
    <div className="flex flex-col gap-2 mt-4">
      <Item variant="outline">
        <ItemContent>
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded mt-2" />
        </ItemContent>
      </Item>
    </div>
  )

  return (
    <div className="flex flex-col gap-2 mt-8">
      <ConfirmationTicket
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmLink}
        ticketId={selectedTicketId || 0}
        isLoading={linkingTicketId !== null}
      />

      <Tabs defaultValue="linked" className="w-full">
        <TabsList>
          <TabsTrigger value="linked">Linked Tickets</TabsTrigger>
          <TabsTrigger value="similar" className="flex items-center gap-2">
            Similar Tickets
            {similarLoading ? (
              <Spinner className="size-3 ml-1" />
            ) : (
              similarTickets.length > 0 && (
                <Badge variant="default" className="ml-1 px-1.5 py-0 text-xs">
                  {similarTickets.length}
                </Badge>
              )
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="linked">
          {loading ? (
            skeletonComponent
          ) : linkedTicketObjects.length === 0 ? (
            <div>
              <p className="text-sm text-muted-foreground text-center">No linked tickets.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {linkedTicketObjects.map(item => (
                <Item key={item.id} variant="outline">
                  <ItemContent>
                    <ItemTitle>
                      #{item.id}{' '}
                      <Badge
                        className={
                          statusColorMap[item.status] || 'bg-secondary text-secondary-foreground'
                        }
                      >
                        {item.status}
                      </Badge>
                    </ItemTitle>
                    <ItemDescription>{item.subject}</ItemDescription>
                  </ItemContent>
                  <ItemActions className="flex-col items-start">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`${zendeskBaseUrl}/agent/tickets/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLinkIcon className="size-4" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open ticket</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleUnlinkTicket(item.id)}
                            disabled={unlinkingTicketId === item.id}
                            className="cursor-pointer disabled:cursor-not-allowed"
                          >
                            {unlinkingTicketId === item.id ? (
                              <Spinner className="size-4" />
                            ) : (
                              <UnlinkIcon className="size-4" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unlink ticket</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </ItemActions>
                </Item>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="similar">
          <div>
            <Item
              variant="default"
              size="sm"
              className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
            >
              <ItemMedia>
                <InfoIcon className="size-4 text-yellow-600 dark:text-yellow-500" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-sm text-yellow-800 dark:text-yellow-200">
                  Showing up to 10 similar tickets.
                </ItemTitle>
              </ItemContent>
            </Item>

            {similarLoading ? (
              skeletonComponent
            ) : similarTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-4">
                No similar tickets found.
              </p>
            ) : (
              <div className="flex flex-col gap-2 mt-4 max-h-48 overflow-y-auto">
                {similarTickets.map(item => (
                  <Item key={item.id} variant="outline">
                    <ItemContent>
                      <ItemTitle>
                        #{item.id}{' '}
                        <Badge
                          className={
                            statusColorMap[item.status] || 'bg-secondary text-secondary-foreground'
                          }
                        >
                          {item.status}
                        </Badge>
                      </ItemTitle>
                      <ItemDescription>{item.subject}</ItemDescription>
                    </ItemContent>
                    <ItemActions className="flex-col items-start">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`${zendeskBaseUrl}/agent/tickets/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLinkIcon className="size-4" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open ticket</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleLinkSimilarTicket(item.id)}
                              disabled={linkingTicketId === item.id}
                              className="cursor-pointer disabled:cursor-not-allowed"
                            >
                              {linkingTicketId === item.id ? (
                                <Spinner className="size-4" />
                              ) : (
                                <LinkIcon className="size-4" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Link ticket</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </ItemActions>
                  </Item>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LinkedTicket
