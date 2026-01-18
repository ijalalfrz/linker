# Search Ticket Sequence Diagram

This diagram shows the flow when a user searches for tickets and links one to the current ticket.

```mermaid
sequenceDiagram
    actor User
    participant SearchTicket as SearchTicket Component
    participant ConfirmationTicket as ConfirmationTicket Dialog
    participant Container
    participant ZAFClient
    participant ZendeskAPI as Zendesk API

    User->>SearchTicket: Enter search query
    User->>SearchTicket: Click Search / Press Enter
    
    SearchTicket->>SearchTicket: handleSearch()
    SearchTicket->>ZAFClient: searchTicket(query)
    ZAFClient->>ZendeskAPI: GET /api/v2/search.json?query=type:ticket {query}
    ZendeskAPI-->>ZAFClient: Return search results
    ZAFClient-->>SearchTicket: Return TicketSearchResponse
    SearchTicket->>SearchTicket: setResults(data.results)
    SearchTicket->>User: Display search results panel
    
    User->>SearchTicket: Click Link icon on ticket
    SearchTicket->>SearchTicket: handleLinkTicket(linkedTicketId)
    SearchTicket->>SearchTicket: setSelectedTicketId(linkedTicketId)
    SearchTicket->>ConfirmationTicket: Open dialog (setConfirmDialogOpen(true))
    
    ConfirmationTicket->>User: Show confirmation dialog
    User->>ConfirmationTicket: Enter optional comment
    User->>ConfirmationTicket: Click Link button
    
    ConfirmationTicket->>SearchTicket: handleConfirmLink(comment)
    SearchTicket->>SearchTicket: Find ticket from results
    SearchTicket->>Container: onTicketLinked(linkedTicket, comment)
    
    Note over Container: See "Link Ticket" diagram for details
    
    Container-->>SearchTicket: Success
    SearchTicket->>SearchTicket: setResults(null) - Hide panel
    SearchTicket->>SearchTicket: setConfirmDialogOpen(false)
    SearchTicket->>SearchTicket: Clear query
    SearchTicket->>User: Update UI
```

## Key Components

- **SearchTicket Component** (`search-ticket.tsx`): Handles search UI and user interactions
- **ConfirmationTicket Dialog** (`confirmation-ticket.tsx`): Prompts for optional internal comment
- **Container** (`container.tsx`): Manages ticket linking logic
- **ZAFClient** (`zaf-client.ts`): Wrapper for Zendesk API calls
- **Zendesk API**: External API for ticket operations

## Key Functions

- `handleSearch()`: Initiates ticket search
- `searchTicket(query)`: Makes API call to search tickets
- `handleLinkTicket(ticketId)`: Opens confirmation dialog
- `handleConfirmLink(comment)`: Processes ticket linking with optional comment
