# Unlink Ticket Sequence Diagram

This diagram shows the flow when unlinking two previously linked tickets, including bidirectional removal and internal comment creation.

```mermaid
sequenceDiagram
    actor User
    participant LinkedTicket as LinkedTicket Component
    participant Container
    participant TicketHelper as ticket-helper
    participant ZAFClient
    participant ZendeskAPI as Zendesk API

    User->>LinkedTicket: Click Unlink icon on linked ticket
    LinkedTicket->>LinkedTicket: handleUnlinkTicket(ticketId)
    LinkedTicket->>LinkedTicket: setUnlinkingTicketId(ticketId)
    LinkedTicket->>Container: onTicketUnlinked(ticketId)
    
    Container->>Container: handleTicketUnlinked(unlinkedTicketId)
    
    Note over Container: Step 1: Get target ticket's linked field
    Container->>ZAFClient: getTicket(unlinkedTicketId)
    ZAFClient->>ZendeskAPI: GET /api/v2/tickets/{ticketId}.json
    ZendeskAPI-->>ZAFClient: Return ticket data with custom_fields
    ZAFClient-->>Container: Return TicketResponse
    Container->>Container: Extract linked tickets from custom field
    
    Note over Container: Step 2: Remove from linked ticket arrays
    Container->>TicketHelper: removeLinkedTicket(linkedTicketField, unlinkedTicketId)
    TicketHelper->>TicketHelper: Filter out `link:{ticketId}`
    TicketHelper-->>Container: Return updated array for current ticket
    Container->>TicketHelper: removeLinkedTicket(targetLinkedField, ticket.id)
    TicketHelper->>TicketHelper: Filter out `link:{ticketId}`
    TicketHelper-->>Container: Return updated array for target ticket
    
    Note over Container: Step 3: Update both tickets (bidirectional)
    Container->>ZAFClient: updateLinkedTickets(ticket.id, unlinkedTicketId, updatedLinkedTickets, updatedTargetLinked)
    ZAFClient->>ZAFClient: Build bulk update payload
    ZAFClient->>ZendeskAPI: PUT /api/v2/tickets/update_many.json
    Note over ZAFClient,ZendeskAPI: Updates custom field for both tickets
    ZendeskAPI-->>ZAFClient: Return update response
    ZAFClient-->>Container: Success
    
    Note over Container: Step 4: Add internal comments
    Container->>Container: addInternalComment(ticket.id, unlinkedTicketId, 'Unlinked')
    
    par Add comment to current ticket
        Container->>ZAFClient: addInternalComment(ticket.id, "Unlinked ticket #{unlinkedTicketId}.")
        ZAFClient->>ZendeskAPI: PUT /api/v2/tickets/{ticket.id}.json
        Note over ZAFClient,ZendeskAPI: Add internal comment with public: false
        ZendeskAPI-->>ZAFClient: Success
        ZAFClient-->>Container: Success
    and Add comment to target ticket
        Container->>ZAFClient: addInternalComment(unlinkedTicketId, "Unlinked ticket #{ticket.id}.")
        ZAFClient->>ZendeskAPI: PUT /api/v2/tickets/{unlinkedTicketId}.json
        Note over ZAFClient,ZendeskAPI: Add internal comment with public: false
        ZendeskAPI-->>ZAFClient: Success
        ZAFClient-->>Container: Success
    end
    
    Note over Container: Step 5: Update local state
    Container->>Container: setLinkedTicketObjects(prev => filter out unlinked ticket)
    Container->>Container: setLinkedTicketField(prev => filter out `link:{ticketId}`)
    
    Container-->>LinkedTicket: Success
    
    Note over LinkedTicket: Optional: Add back to similar tickets if applicable
    LinkedTicket->>LinkedTicket: Check if ticket was from similar tickets
    alt Ticket was from similar tickets
        LinkedTicket->>LinkedTicket: setSimilarTickets(prev => [unlinkedTicket, ...prev])
    end
    
    LinkedTicket->>LinkedTicket: setUnlinkingTicketId(null)
    LinkedTicket->>User: Update UI
```

## Key Components

- **LinkedTicket Component** (`linked-ticket.tsx`): Displays linked tickets and handles unlink action
- **Container** (`container.tsx`): Orchestrates the unlinking process
- **TicketHelper** (`ticket-helper.ts`): Helper functions for managing linked ticket arrays
- **ZAFClient** (`zaf-client.ts`): API client wrapper
- **Zendesk API**: External API

## Key Functions

- `handleUnlinkTicket(ticketId)`: Initiates unlink process in component
- `handleTicketUnlinked(unlinkedTicketId)`: Main unlinking orchestration in container
- `getTargetTicketLinkedField(ticketId)`: Fetches target ticket's current linked tickets
- `removeLinkedTicket(linked, ticketId)`: Removes ticket ID from linked array
- `updateLinkedTickets()`: Bulk updates both tickets' custom fields
- `addInternalComment()`: Adds internal comment to both tickets

## Important Notes

- **Bidirectional Unlinking**: Both tickets are updated to remove references to each other
- **Internal Comments**: Added to both tickets to track the unlink action
- **Similar Tickets**: If the unlinked ticket was originally from similar tickets, it's added back to that list
- **Atomic Operation**: Uses bulk update API to ensure consistency
