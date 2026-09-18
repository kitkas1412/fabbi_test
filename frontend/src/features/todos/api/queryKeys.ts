const TODO_QUERY_ROOT = ["todos"] as const;

// Keep the default aligned with the backend's maximum accepted page size.
export const DEFAULT_TODO_PAGE_SIZE = 100;

export const todoKeys = {
  all: TODO_QUERY_ROOT,
  user: (userId: string) => [...TODO_QUERY_ROOT, userId] as const,
  list: (userId: string, page: number, size: number) =>
    [...TODO_QUERY_ROOT, userId, "list", { page, size }] as const,
};
