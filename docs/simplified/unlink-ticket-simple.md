# Unlink Ticket - Simplified Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UnlinkTicket as Unlink Ticket Feature
    participant Linker as Linker App
    participant ZendeskAPI as Zendesk API

    User->>UnlinkTicket: Click Unlink on linked ticket
    UnlinkTicket->>Linker: Request to unlink ticket
    
    Note over Linker,ZendeskAPI: Get target ticket's current linked tickets
    Linker->>ZendeskAPI: GET /api/v2/tickets/{targetId}.json
    ZendeskAPI-->>Linker: Return ticket data
    
    Note over Linker,ZendeskAPI: Remove link from both tickets
    Linker->>ZendeskAPI: PUT /api/v2/tickets/update_many.json
    ZendeskAPI-->>Linker: Both tickets updated
    
    Note over Linker,ZendeskAPI: Add internal comments to both tickets
    Linker->>ZendeskAPI: PUT /api/v2/tickets/{currentId}.json (add comment)
    Linker->>ZendeskAPI: PUT /api/v2/tickets/{targetId}.json (add comment)
    ZendeskAPI-->>Linker: Comments added
    
    Linker-->>UnlinkTicket: Unlink successful
    UnlinkTicket-->>User: Update UI
```
