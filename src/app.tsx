import { useEffect, useState } from 'react'
import Container from './container'
import type { ZendeskClient, Ticket } from './types'

function App({ client }: { client: ZendeskClient }) {
  const customFieldKey = import.meta.env.VITE_LINKED_TICKETS_CUSTOM_FIELD_ID
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [linkedTickets, setLinkedTickets] = useState<string[]>([])

  useEffect(() => {
    if (!client) return
    client.invoke('resize', { width: '100%', height: '400px' })
    client
      .get(`ticket.customField:custom_field_${customFieldKey}`)
      .then((data: unknown) => {
        const result = data as Record<string, string>
        const linkedTicketIdString: string =
          result['ticket.customField:custom_field_' + customFieldKey]
        if (!linkedTicketIdString) {
          setLinkedTickets([])
          return
        }
        const linkedTicketIds: string[] = linkedTicketIdString.split(',')
        setLinkedTickets(linkedTicketIds)
      })
      .catch((error: unknown) => {
        console.error('Error fetching custom field:', error)
      })

    client
      .get('ticket')
      .then((data: unknown) => {
        const result = data as { ticket: Ticket }
        setTicket(result.ticket)
      })
      .catch((error: unknown) => {
        console.error('Error fetching ticket:', error)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client])

  return (
    <>
      <Container client={client} ticket={ticket} linkedTickets={linkedTickets} />
    </>
  )
}

export default App
