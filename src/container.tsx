import { useState, useEffect } from 'react'
import SearchTicket from './ticket/search-ticket'
import LinkedTicket from './ticket/linked-ticket'
import { ZAFClient } from './zaf-client'
import { addLinkedTicket, removeLinkedTicket } from './ticket/ticket-helper'
import type { ZendeskClient, Ticket, CustomField } from './types'

// centralized ticket linking/unlinking and state management
function Container({
  client,
  ticket,
  linkedTickets,
}: {
  client: ZendeskClient
  ticket: Ticket | null
  linkedTickets: string[]
}) {
  const customFieldKey = import.meta.env.VITE_LINKED_TICKETS_CUSTOM_FIELD_ID
  const zendeskClient = new ZAFClient(client, customFieldKey)

  // ticket objects of linked tickets
  const [linkedTicketObjects, setLinkedTicketObjects] = useState<Ticket[]>([])

  // linked ticket field values example: ["link:123", "link:456"]
  const [linkedTicketField, setLinkedTicketField] = useState<string[]>([])

  useEffect(() => {
    setLinkedTicketField(linkedTickets)
  }, [linkedTickets])

  const getTargetTicketLinkedField = async (ticketId: number): Promise<string[]> => {
    try {
      const response = await zendeskClient.getTicket(ticketId)
      console.log('Fetched target ticket data:', response)
      const customFields = response.ticket.custom_fields || []
      const targetField = customFields.find(
        (f: CustomField) => f.id === parseInt(customFieldKey, 10)
      )
      if (targetField && typeof targetField.value === 'string') {
        return targetField.value
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      }
      return []
    } catch (error) {
      console.error('Error fetching target ticket linked field:', error)
      return []
    }
  }

  const addInternalComment = async (
    ticketId: number,
    targetTicketId: number,
    type: string,
    comment?: string
  ) => {
    try {
      let internalComment = `${type} ticket #${targetTicketId}.`
      let internalCommentTarget = `${type} ticket #${ticketId}.`
      if (comment && comment.trim().length > 0) {
        internalComment += `\n\nComment: ${comment.trim()}`
        internalCommentTarget += `\n\nComment: ${comment.trim()}`
      }

      await Promise.all([
        zendeskClient.addInternalComment(ticketId, internalComment),
        zendeskClient.addInternalComment(targetTicketId, internalCommentTarget),
      ])
    } catch (error) {
      console.error('Error adding internal comment:', error)
    }
  }

  const handleTicketLinked = async (newTicket: Ticket, comment?: string) => {
    if (!ticket?.id) {
      console.error('Current ticket ID not available')
      return
    }

    try {
      const updatedLinkedTickets = addLinkedTicket(linkedTicketField, newTicket.id)
      const targetLinkedField = await getTargetTicketLinkedField(newTicket.id)
      const updatedTargetLinked = addLinkedTicket(targetLinkedField, ticket.id)

      await zendeskClient.updateLinkedTickets(
        ticket.id,
        newTicket.id,
        updatedLinkedTickets,
        updatedTargetLinked
      )

      // add internal comment
      await addInternalComment(ticket.id, newTicket.id, 'Linked', comment)
      console.log('Successfully linked ticket:', newTicket.id)

      setLinkedTicketObjects(prev => [...prev, newTicket])
      setLinkedTicketField(prev => [...prev, `link:${newTicket.id}`])
    } catch (error) {
      console.error('Error linking ticket:', error)
      throw error
    }
  }

  const handleTicketUnlinked = async (unlinkedTicketId: number) => {
    if (!ticket?.id) {
      console.error('Current ticket ID not available')
      return
    }

    try {
      const updatedLinkedTickets = removeLinkedTicket(linkedTicketField, unlinkedTicketId)
      const targetLinkedField = await getTargetTicketLinkedField(unlinkedTicketId)
      const updatedTargetLinked = removeLinkedTicket(targetLinkedField, ticket.id)
      await zendeskClient.updateLinkedTickets(
        ticket.id,
        unlinkedTicketId,
        updatedLinkedTickets,
        updatedTargetLinked
      )

      // add internal comment
      await addInternalComment(ticket.id, unlinkedTicketId, 'Unlinked')

      console.log('Successfully unlinked ticket:', unlinkedTicketId)

      setLinkedTicketObjects(prev => prev.filter(t => t.id !== unlinkedTicketId))
      setLinkedTicketField(prev => prev.filter(t => t !== `link:${unlinkedTicketId}`))
    } catch (error) {
      console.error('Error unlinking ticket:', error)
      throw error
    }
  }

  return (
    <div className="max-w-7xl mx-auto pt-2 px-2">
      <SearchTicket
        client={zendeskClient}
        ticket={ticket}
        linkedTicketField={linkedTicketField}
        onTicketLinked={handleTicketLinked}
      />

      {/* linked ticket  */}
      <LinkedTicket
        client={zendeskClient}
        ticket={ticket}
        linkedTicketField={linkedTicketField}
        linkedTicketObjects={linkedTicketObjects}
        setLinkedTicketObjects={setLinkedTicketObjects}
        onTicketLinked={handleTicketLinked}
        onTicketUnlinked={handleTicketUnlinked}
      />
    </div>
  )
}

export default Container
