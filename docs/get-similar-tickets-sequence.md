# Get Similar Tickets Sequence Diagram

This diagram shows the automatic flow for fetching and displaying similar tickets based on the current ticket's subject.

```mermaid
sequenceDiagram
    actor User
    participant LinkedTicket as LinkedTicket Component
    participant TicketHelper as ticket-helper
    participant ZAFClient
    participant ZendeskAPI as Zendesk API

    Note over User,ZendeskAPI: Triggered automatically when ticket loads or changes
    
    LinkedTicket->>LinkedTicket: useEffect on ticket.id change
    LinkedTicket->>LinkedTicket: fetchSimilarTickets()
    
    alt No ticket subject
        LinkedTicket->>LinkedTicket: setSimilarTickets([])
        LinkedTicket->>User: Show "No similar tickets"
    else Has ticket subject
        LinkedTicket->>LinkedTicket: setSimilarLoading(true)
        
        Note over LinkedTicket: Step 1: Prepare exclusion list
        LinkedTicket->>TicketHelper: getLinkedTicketIds(linkedTicketField)
        TicketHelper-->>LinkedTicket: Return array of linked ticket IDs
        LinkedTicket->>LinkedTicket: Create exclusion set: [current ticket, ...linked tickets]
        
        Note over LinkedTicket: Step 2: Search with pagination
        LinkedTicket->>ZAFClient: searchTicketPagination(ticket.subject, 10 + exclusionSet.size)
        Note over LinkedTicket,ZAFClient: Request extra tickets to account for filtering
        ZAFClient->>ZendeskAPI: GET /api/v2/search/export.json?query={subject}&page[size]={size}&filter[type]=ticket
        ZendeskAPI-->>ZAFClient: Return search results
        ZAFClient-->>LinkedTicket: Return TicketSearchResponse
        
        Note over LinkedTicket: Step 3: Filter and limit results
        LinkedTicket->>LinkedTicket: Filter out tickets in exclusion set
        LinkedTicket->>LinkedTicket: Slice to max 10 tickets
        LinkedTicket->>LinkedTicket: setSimilarTickets(filteredTickets)
        LinkedTicket->>LinkedTicket: setSimilarLoading(false)
        
        LinkedTicket->>User: Display similar tickets in "Similar Tickets" tab
        LinkedTicket->>User: Show badge with count
    end
    
    Note over User,LinkedTicket: User can link similar tickets
    User->>LinkedTicket: Click "Similar Tickets" tab
    LinkedTicket->>User: Display list of similar tickets
    
    User->>LinkedTicket: Click Link icon on similar ticket
    LinkedTicket->>LinkedTicket: handleLinkSimilarTicket(ticketId)
    
    Note over LinkedTicket: See "Link Ticket" diagram for linking flow
    
    LinkedTicket->>LinkedTicket: Remove from similar tickets list
    LinkedTicket->>LinkedTicket: Add to linkedSimilarTicketIds set
    LinkedTicket->>User: Update UI
```

## Key Components

- **LinkedTicket Component** (`linked-ticket.tsx`): Manages similar tickets display and linking
- **TicketHelper** (`ticket-helper.ts`): Extracts linked ticket IDs
- **ZAFClient** (`zaf-client.ts`): API client wrapper
- **Zendesk API**: External API for ticket search

## Key Functions

- `fetchSimilarTickets()`: Main function to fetch similar tickets
- `searchTicketPagination(query, size)`: Search API with pagination support
- `getLinkedTicketIds(linkedTicketField)`: Extract IDs from linked ticket field
- `handleLinkSimilarTicket(ticketId)`: Initiates linking from similar tickets

## Important Notes

- **Automatic Trigger**: Runs automatically when ticket loads or ticket ID changes
- **Smart Filtering**: Excludes current ticket and already linked tickets from results
- **Over-fetching Strategy**: Requests more tickets than needed (10 + exclusion count) to ensure 10 results after filtering
- **Limit**: Maximum 10 similar tickets displayed
- **Search Query**: Uses ticket subject as search query
- **UI Integration**: Displays in "Similar Tickets" tab with count badge
- **State Tracking**: Tracks which similar tickets have been linked to restore them if unlinked

## Search API Details

- **Endpoint**: `/api/v2/search/export.json`
- **Parameters**:
  - `query`: Ticket subject
  - `page[size]`: Number of results
  - `filter[type]`: Set to "ticket"
