// stand-in for the backend's PageResponse<T> before the first page has loaded
export const EMPTY_PAGE = Object.freeze({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
