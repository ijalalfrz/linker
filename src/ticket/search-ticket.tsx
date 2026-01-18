import { useState, useRef, useEffect } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { ZAFClient } from '@/zaf-client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LinkIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { getSkippedTicketIds } from './ticket-helper'
import ConfirmationTicket from './confirmation-ticket'
import type { Ticket } from '../types'

interface SearchTicketProps {
  client: ZAFClient
  ticket: Ticket | null
  linkedTicketField?: string[]
  onTicketLinked?: (ticket: Ticket, comment?: string) => Promise<void>
}

function SearchTicket({ client, ticket, linkedTicketField, onTicketLinked }: SearchTicketProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ticket[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [linkingTicketId, setLinkingTicketId] = useState<number | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const skippedIdMap = getSkippedTicketIds(linkedTicketField || [])
  // skip existing ticket id as well
  if (ticket && ticket.id) {
    skippedIdMap[ticket.id] = true
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore clicks on dialog elements
      const target = event.target as HTMLElement
      if (target.closest('[role="dialog"]') || target.closest('[data-radix-portal]')) {
        return
      }

      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setResults(null)
      }
    }

    if (results) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [results])

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)

    try {
      const data = await client.searchTicket(query)
      setResults(data.results || [])
    } catch (error) {
      console.error(error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleLinkTicket = async (linkedTicketId: number) => {
    setSelectedTicketId(linkedTicketId)
    setConfirmDialogOpen(true)
  }

  const handleConfirmLink = async (comment: string) => {
    if (!selectedTicketId) {
      console.error('Selected ticket ID not available')
      return
    }

    setLinkingTicketId(selectedTicketId)
    try {
      // Find the ticket data from results
      const linkedTicket = results?.find(r => r.id === selectedTicketId)
      if (linkedTicket && onTicketLinked) {
        await onTicketLinked(linkedTicket, comment)
      }

      setResults(null) // Hide the search panel after successful link
      setConfirmDialogOpen(false)
      setSelectedTicketId(null)
    } catch (error) {
      console.error('Error linking ticket:', error)
    } finally {
      setLinkingTicketId(null)
      setQuery('')
    }
  }

  return (
    <div className="relative">
      <ConfirmationTicket
        open={confirmDialogOpen}
        onOpenChange={open => {
          setConfirmDialogOpen(open)
          if (!open) {
            setSelectedTicketId(null)
          }
        }}
        onConfirm={handleConfirmLink}
        ticketId={selectedTicketId || 0}
        isLoading={linkingTicketId !== null}
      />

      {/* Search bar */}
      <div ref={panelRef} className="relative z-50">
        <InputGroup className={results ? 'bg-background' : ''}>
          <InputGroupInput
            placeholder="Search ticket by id or title..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            className="placeholder:text-sm"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              className="cursor-pointer disabled:cursor-not-allowed"
              variant="default"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? <Spinner className="size-4" /> : 'Search'}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {/* Results panel */}
        {results && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 border rounded-lg bg-background shadow-lg z-50 max-h-[250px] overflow-y-auto">
            {results.length === 0 && (
              <p className="text-sm text-muted-foreground">No results found.</p>
            )}

            <div className="flex flex-col gap-2">
              {results
                .filter(item => !skippedIdMap[item.id])
                .map(item => (
                  <Item key={item.id} variant="outline" className="overflow-hidden">
                    <ItemContent className="overflow-hidden">
                      <ItemTitle className="wrap-break-word overflow-hidden text-ellipsis">
                        #{item.id} - {item.subject}
                      </ItemTitle>
                      <ItemDescription className="wrap-break-word overflow-hidden">
                        {item.description || 'No description'}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="flex-col items-start">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleLinkTicket(item.id)}
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
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchTicket
