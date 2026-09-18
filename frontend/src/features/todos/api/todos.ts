import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { todoKeys } from "./queryKeys";

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TodoListResponse {
  items: Todo[];
  total: number;
  page: number;
  size: number;
}

interface CreateTodoRequest {
  title: string;
  description?: string;
}

interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

interface UpdateTodoVariables {
  id: string;
  userId: string;
  data: UpdateTodoRequest;
}

interface DeleteTodoVariables {
  id: string;
  userId: string;
}

export function useTodos(
  userId: string | undefined,
  page: number = 1,
  size: number = 100
) {
  return useQuery({
    queryKey: todoKeys.list(userId ?? "anonymous", page, size),
    queryFn: async (): Promise<TodoListResponse> => {
      const response = await api.get("/todos", {
        params: { page, size },
      });
      return response.data;
    },
    enabled: Boolean(userId),
  });
}

export function useCreateTodo() {
  return useMutation({
    mutationFn: async (data: CreateTodoRequest): Promise<Todo> => {
      const response = await api.post("/todos", data);
      return response.data;
    },
    onSuccess: (todo) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.user(todo.user_id) });
      toast.success("Todo created successfully!");
    },
    onError: () => {
      toast.error("Failed to create todo");
    },
  });
}

export function useUpdateTodo() {
  return useMutation({
    mutationFn: async ({ id, data }: UpdateTodoVariables): Promise<Todo> => {
      const response = await api.put(`/todos/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, userId, data }) => {
      const queryKey = todoKeys.user(userId);
      await queryClient.cancelQueries({ queryKey });

      const previousTodos = queryClient.getQueriesData<TodoListResponse>({
        queryKey,
      });

      queryClient.setQueriesData<TodoListResponse>({ queryKey }, (todos) => {
        if (!todos) {
          return todos;
        }

        return {
          ...todos,
          items: todos.items.map((todo) =>
            todo.id === id ? { ...todo, ...data } : todo
          ),
        };
      });

      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      context?.previousTodos.forEach(([queryKey, todos]) => {
        queryClient.setQueryData(queryKey, todos);
      });
      toast.error("Failed to update todo");
    },
    onSettled: (_data, _error, { userId }) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.user(userId) });
    },
  });
}

export function useDeleteTodo() {
  return useMutation({
    mutationFn: async ({ id }: DeleteTodoVariables): Promise<void> => {
      await api.delete(`/todos/${id}`);
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.user(userId) });
      toast.success("Todo deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete todo");
    },
  });
}

export function useToggleTodo() {
  const updateTodo = useUpdateTodo();

  return {
    ...updateTodo,
    mutate: (todo: Todo) => {
      updateTodo.mutate({
        id: todo.id,
        userId: todo.user_id,
        data: { completed: !todo.completed },
      });
    },
  };
}
