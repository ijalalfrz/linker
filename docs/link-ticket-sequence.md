# Link Ticket Sequence Diagram

This diagram shows the complete flow when linking two tickets together, including bidirectional linking and internal comment creation.

```mermaid
sequenceDiagram
    actor User
    participant Component as SearchTicket/LinkedTicket
    participant Container
    participant TicketHelper as ticket-helper
    participant ZAFClient
    participant ZendeskAPI as Zendesk API

    User->>Component: Trigger link action
    Component->>Container: onTicketLinked(newTicket, comment)
    
    Container->>Container: handleTicketLinked(newTicket, comment)
    
    Note over Container: Step 1: Get target ticket's linked field
    Container->>ZAFClient: getTicket(newTicket.id)
    ZAFClient->>ZendeskAPI: GET /api/v2/tickets/{ticketId}.json
    ZendeskAPI-->>ZAFClient: Return ticket data with custom_fields
    ZAFClient-->>Container: Return TicketResponse
    Container->>Container: Extract linked tickets from custom field
    
    Note over Container: Step 2: Update linked ticket arrays
    Container->>TicketHelper: addLinkedTicket(linkedTicketField, newTicket.id)
    TicketHelper-->>Container: Return updated array for current ticket
    Container->>TicketHelper: addLinkedTicket(targetLinkedField, ticket.id)
    TicketHelper-->>Container: Return updated array for target ticket
    
    Note over Container: Step 3: Update both tickets (bidirectional)
    Container->>ZAFClient: updateLinkedTickets(ticket.id, newTicket.id, updatedLinkedTickets, updatedTargetLinked)
    ZAFClient->>ZAFClient: Build bulk update payload
    ZAFClient->>ZendeskAPI: PUT /api/v2/tickets/update_many.json
    Note over ZAFClient,ZendeskAPI: Updates custom field for both tickets
    ZendeskAPI-->>ZAFClient: Return update response
    ZAFClient-->>Container: Success
    
    Note over Container: Step 4: Add internal comments (optional)
    Container->>Container: addInternalComment(ticket.id, newTicket.id, 'Linked', comment)
    
    par Add comment to current ticket
        Container->>ZAFClient: addInternalComment(ticket.id, "Linked ticket #{newTicket.id}. Comment: {comment}")
        ZAFClient->>ZendeskAPI: PUT /api/v2/tickets/{ticket.id}.json
        Note over ZAFClient,ZendeskAPI: Add internal comment with public: false
        ZendeskAPI-->>ZAFClient: Success
        ZAFClient-->>Container: Success
    and Add comment to target ticket
        Container->>ZAFClient: addInternalComment(newTicket.id, "Linked ticket #{ticket.id}. Comment: {comment}")
        ZAFClient->>ZendeskAPI: PUT /api/v2/tickets/{newTicket.id}.json
        Note over ZAFClient,ZendeskAPI: Add internal comment with public: false
        ZendeskAPI-->>ZAFClient: Success
        ZAFClient-->>Container: Success
    end
    
    Note over Container: Step 5: Update local state
    Container->>Container: setLinkedTicketObjects(prev => [...prev, newTicket])
    Container->>Container: setLinkedTicketField(prev => [...prev, `link:${newTicket.id}`])
    
    Container-->>Component: Success
    Component->>User: Update UI
```

## Key Components

- **Container** (`container.tsx`): Orchestrates the linking process
- **TicketHelper** (`ticket-helper.ts`): Helper functions for managing linked ticket arrays
- **ZAFClient** (`zaf-client.ts`): API client wrapper
- **Zendesk API**: External API

## Key Functions

- `handleTicketLinked(newTicket, comment)`: Main linking orchestration
- `getTargetTicketLinkedField(ticketId)`: Fetches target ticket's current linked tickets
- `addLinkedTicket(linked, ticketId)`: Adds ticket ID to linked array
- `updateLinkedTickets()`: Bulk updates both tickets' custom fields
- `addInternalComment()`: Adds internal comment to both tickets

## Important Notes

- **Bidirectional Linking**: Both tickets are updated to reference each other
- **Custom Field Format**: Linked tickets stored as comma-separated string: `"link:123,link:456"`
- **Internal Comments**: Added to both tickets with optional user comment
- **Atomic Operation**: Uses bulk update API to ensure consistency
