const TODO_QUERY_ROOT = ["todos"] as const;

export const todoKeys = {
  all: TODO_QUERY_ROOT,
  user: (userId: string) => [...TODO_QUERY_ROOT, userId] as const,
  list: (userId: string, page: number, size: number) =>
    [...TODO_QUERY_ROOT, userId, "list", { page, size }] as const,
};
