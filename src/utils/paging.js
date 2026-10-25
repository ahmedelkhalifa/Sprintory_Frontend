// Default page size of every paginated list (the backend caps it at 100)
export const PAGE_SIZE = 20;

/**
 * Query params for a paginated, searchable list.
 * A blank search is left out, so the backend returns the whole list.
 */
export function pageParams({ q = "", page = 0, size = PAGE_SIZE } = {}) {
  const search = q.trim();
  return { page, size, ...(search && { q: search }) };
}

/**
 * Turn the backend's PageResponse into the shape our pages use,
 * passing every item through mapItem (a translator like toProject).
 * { content, page, size, totalElements, totalPages } -> { items, page, size, total, totalPages }
 */
export function toPage(raw, mapItem = (item) => item) {
  return {
    items: (raw?.content ?? []).map(mapItem),
    page: raw?.page ?? 0,
    size: raw?.size ?? PAGE_SIZE,
    total: raw?.totalElements ?? 0,
    totalPages: raw?.totalPages ?? 0,
  };
}
