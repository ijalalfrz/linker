export function getSkippedTicketIds(linked: string[]) {
  if (!linked) return {}
  const skippedIds: Record<number, boolean> = {}
  linked.forEach((tag: string) => {
    if (tag.startsWith('link:')) {
      const idStr = tag.substring(5)
      const id = parseInt(idStr, 10)
      if (!isNaN(id)) {
        skippedIds[id] = true
      }
    }
  })
  return skippedIds
}

export function getLinkedTicketIds(linked: string[]): number[] {
  if (!linked || !Array.isArray(linked)) return []
  const linkedIds: number[] = []
  linked.forEach((ticket: string) => {
    if (typeof ticket === 'string' && ticket.startsWith('link:')) {
      const idStr = ticket.substring(5)
      const id = parseInt(idStr, 10)
      if (!isNaN(id)) {
        linkedIds.push(id)
      }
    }
  })
  return linkedIds
}

export function addLinkedTicket(linked: string[], ticketId: number): string[] {
  const newLinked = [...linked]
  if (newLinked.includes(`link:${ticketId}`)) {
    return newLinked
  }
  newLinked.push(`link:${ticketId}`)
  return newLinked
}

export function removeLinkedTicket(linked: string[], ticketId: number): string[] {
  return linked.filter(t => t !== `link:${ticketId}`)
}
