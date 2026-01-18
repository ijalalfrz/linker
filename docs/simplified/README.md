# Simplified Sequence Diagrams

This directory contains simplified versions of the Linker sequence diagrams with a 4-layer architecture:

**Actor → Feature → Linker → Zendesk API**

## Diagrams

1. **[search-ticket-simple.md](./search-ticket-simple.md)** - Search and link tickets
2. **[link-ticket-simple.md](./link-ticket-simple.md)** - Bidirectional ticket linking
3. **[unlink-ticket-simple.md](./unlink-ticket-simple.md)** - Bidirectional ticket unlinking
4. **[get-similar-tickets-simple.md](./get-similar-tickets-simple.md)** - Automatic similar ticket discovery

## Architecture Layers

- **Actor (User)**: The Zendesk agent using the application
- **Feature**: The specific feature component (Search, Link, Unlink, Similar Tickets)
- **Linker App**: The application orchestration layer
- **Zendesk API**: External REST API for ticket operations

## Key API Endpoints

- `GET /api/v2/search.json` - Search tickets
- `GET /api/v2/search/export.json` - Search with pagination
- `GET /api/v2/tickets/{id}.json` - Get ticket details
- `PUT /api/v2/tickets/update_many.json` - Bulk update tickets
- `PUT /api/v2/tickets/{id}.json` - Update single ticket (for comments)

For detailed diagrams with component-level interactions, see the [parent diagrams directory](../).
