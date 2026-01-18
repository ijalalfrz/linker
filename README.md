# Linker Sequence Diagrams

This directory contains Mermaid sequence diagrams documenting the key features of the Linker application.

## Overview

Linker is an open source Zendesk application that allows agents to link related tickets together. The application provides features for searching, linking, unlinking tickets, and automatically finding similar tickets.

## Diagrams

### 1. Search Ticket
Shows the flow when a user searches for tickets using a search query and links a found ticket to the current ticket.

**Key Features:**
- User enters search query
- Search results displayed in a panel
- Confirmation dialog with optional internal comment
- Ticket linking process initiated

### 2. Link Ticket
Details the complete bidirectional ticket linking process, including custom field updates and internal comment creation.

**Key Features:**
- Bidirectional linking (both tickets reference each other)
- Bulk update API for atomic operations
- Internal comments added to both tickets
- Optional user comment included

### 3. Unlink Ticket
Shows the process of unlinking two previously linked tickets, including bidirectional removal.

**Key Features:**
- Bidirectional unlinking (removes references from both tickets)
- Bulk update API for atomic operations
- Internal comments added to both tickets
- Optional restoration to similar tickets list

### 4. Get Similar Tickets
Demonstrates the automatic similarity search feature that finds related tickets based on the current ticket's subject.

**Key Features:**
- Automatic trigger on ticket load
- Smart filtering (excludes current and linked tickets)
- Maximum 10 similar tickets displayed
- Direct linking from similar tickets

- Smart filtering (excludes current and linked tickets)
- Maximum 10 similar tickets displayed
- Direct linking from similar tickets

## Architecture Components

### Frontend Components
- **SearchTicket** (`search-ticket.tsx`): Search UI and user interactions
- **LinkedTicket** (`linked-ticket.tsx`): Displays linked and similar tickets
- **ConfirmationTicket** (`confirmation-ticket.tsx`): Dialog for optional comments
- **Container** (`container.tsx`): Orchestrates ticket operations

### Client/Helper
- **ZAFClient** (`zaf-client.ts`): Wrapper for Zendesk API calls
- **TicketHelper** (`ticket-helper.ts`): Helper functions for ticket array management

### External Services
- **Zendesk API**: REST API for ticket operations

## Data Format

Linked tickets are stored in a custom field as a comma-separated string:
```
"link:123,link:456,link:789"
```

Each linked ticket ID is prefixed with `link:` to distinguish it from other custom field values.

## Key API Endpoints

- `GET /api/v2/search.json` - Search tickets
- `GET /api/v2/search/export.json` - Search with pagination
- `GET /api/v2/tickets/{id}.json` - Get single ticket
- `GET /api/v2/tickets/show_many.json` - Get multiple tickets by IDs
- `PUT /api/v2/tickets/{id}.json` - Update single ticket
- `PUT /api/v2/tickets/update_many.json` - Bulk update tickets

## Notes

- All linking operations are bidirectional to maintain data consistency
- Internal comments are automatically added for audit trail
- The application uses Zendesk's custom fields to store linked ticket relationships
- Similar tickets feature helps agents discover related issues automatically
